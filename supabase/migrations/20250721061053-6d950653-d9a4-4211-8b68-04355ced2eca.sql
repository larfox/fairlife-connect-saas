-- Fix Database Function Security Vulnerabilities
-- Add SECURITY DEFINER SET search_path = '' to prevent search path injection attacks

-- Fix generate_patient_number function
CREATE OR REPLACE FUNCTION public.generate_patient_number()
 RETURNS character varying
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  new_number VARCHAR(20);
  counter INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(patient_number FROM 2) AS INTEGER)), 0) + 1
  INTO counter
  FROM public.patients
  WHERE patient_number IS NOT NULL AND patient_number ~ '^P[0-9]+$';
  
  new_number := 'P' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$function$;

-- Fix assign_patient_number function
CREATE OR REPLACE FUNCTION public.assign_patient_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF NEW.patient_number IS NULL THEN
    NEW.patient_number := public.generate_patient_number();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix handle_know_your_numbers_completion function
CREATE OR REPLACE FUNCTION public.handle_know_your_numbers_completion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE
  kyn_service_id uuid;
  patient_visit_rec record;
  service_rec record;
BEGIN
  -- Only proceed if the status changed to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get the "Know Your Numbers" service ID
    SELECT id INTO kyn_service_id 
    FROM public.services 
    WHERE LOWER(name) LIKE '%know your numbers%' 
    LIMIT 1;
    
    -- Check if this is a "Know Your Numbers" service completion
    IF NEW.service_id = kyn_service_id THEN
      -- Get the patient visit details
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
          AND NOT EXISTS (
            -- Don't add if already in queue
            SELECT 1 FROM public.service_queue sq 
            WHERE sq.patient_visit_id = NEW.patient_visit_id 
            AND sq.service_id = s.id
          )
      LOOP
        -- Add the patient to this service queue with 'waiting' status
        INSERT INTO public.service_queue (
          patient_visit_id,
          service_id,
          status
        ) VALUES (
          NEW.patient_visit_id,
          service_rec.id,
          'waiting'
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, organization)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'organization'
  );
  RETURN NEW;
END;
$function$;