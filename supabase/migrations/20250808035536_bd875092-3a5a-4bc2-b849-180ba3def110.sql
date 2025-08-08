-- Update the function to only add patients to services they've already registered for
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
      
      -- Only update existing service queue entries that are in 'unavailable' status
      -- These are services the patient was already registered for but marked unavailable
      -- when they started "Know Your Numbers"
      UPDATE public.service_queue 
      SET status = 'waiting', updated_at = now()
      WHERE patient_visit_id = NEW.patient_visit_id 
        AND service_id != kyn_service_id 
        AND status = 'unavailable';
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$