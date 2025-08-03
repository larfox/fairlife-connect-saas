-- Let's verify and improve the trigger to ensure it's working properly
-- First, let's check if the trigger exists and recreate it with better logging

DROP TRIGGER IF EXISTS trigger_handle_know_your_numbers_completion ON public.service_queue;
DROP FUNCTION IF EXISTS public.handle_know_your_numbers_completion();

-- Create an improved version of the function with better logic
CREATE OR REPLACE FUNCTION public.handle_know_your_numbers_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  kyn_service_id uuid;
  patient_visit_rec record;
  service_rec record;
  existing_queue_item_count integer;
BEGIN
  -- Only proceed if the status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Get the "Know Your Numbers" service ID
    SELECT id INTO kyn_service_id 
    FROM public.services 
    WHERE LOWER(name) LIKE '%know your numbers%' 
    AND is_active = true
    LIMIT 1;
    
    -- Check if this is a "Know Your Numbers" service completion
    IF NEW.service_id = kyn_service_id THEN
      
      -- Get the patient visit details including the event
      SELECT pv.*, p.id as patient_id, p.first_name, p.last_name
      INTO patient_visit_rec
      FROM public.patient_visits pv
      JOIN public.patients p ON p.id = pv.patient_id
      WHERE pv.id = NEW.patient_visit_id;
      
      -- Find all services for this event that the patient should be enrolled in
      -- but isn't already in the service queue
      FOR service_rec IN 
        SELECT DISTINCT s.id, s.name
        FROM public.services s
        JOIN public.event_services es ON es.service_id = s.id
        WHERE es.event_id = patient_visit_rec.event_id
          AND s.is_active = true
          AND s.id != kyn_service_id  -- Exclude "Know Your Numbers" itself
      LOOP
        
        -- Check if patient is already in this service queue
        SELECT COUNT(*) INTO existing_queue_item_count
        FROM public.service_queue sq 
        WHERE sq.patient_visit_id = NEW.patient_visit_id 
        AND sq.service_id = service_rec.id;
        
        -- Only add if not already in queue
        IF existing_queue_item_count = 0 THEN
          -- Add the patient to this service queue with 'waiting' status
          INSERT INTO public.service_queue (
            patient_visit_id,
            service_id,
            status,
            created_at,
            updated_at
          ) VALUES (
            NEW.patient_visit_id,
            service_rec.id,
            'waiting',
            now(),
            now()
          );
        END IF;
        
      END LOOP;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER trigger_handle_know_your_numbers_completion
  AFTER UPDATE ON public.service_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_know_your_numbers_completion();