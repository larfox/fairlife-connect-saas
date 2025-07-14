-- Create function to automatically add patients to waiting service queues when they complete "Know Your Numbers"
CREATE OR REPLACE FUNCTION public.handle_know_your_numbers_completion()
RETURNS TRIGGER AS $$
DECLARE
  kyn_service_id uuid;
  patient_visit_rec record;
  service_rec record;
BEGIN
  -- Only proceed if the status changed to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Get the "Know Your Numbers" service ID
    SELECT id INTO kyn_service_id 
    FROM services 
    WHERE LOWER(name) LIKE '%know your numbers%' 
    LIMIT 1;
    
    -- Check if this is a "Know Your Numbers" service completion
    IF NEW.service_id = kyn_service_id THEN
      -- Get the patient visit details
      SELECT pv.*, p.id as patient_id, p.first_name, p.last_name
      INTO patient_visit_rec
      FROM patient_visits pv
      JOIN patients p ON p.id = pv.patient_id
      WHERE pv.id = NEW.patient_visit_id;
      
      -- Find all services for this event that the patient should be enrolled in
      -- but isn't already in the service queue
      FOR service_rec IN 
        SELECT DISTINCT s.id, s.name
        FROM services s
        JOIN event_services es ON es.service_id = s.id
        WHERE es.event_id = patient_visit_rec.event_id
          AND s.is_active = true
          AND s.id != kyn_service_id  -- Exclude "Know Your Numbers" itself
          AND NOT EXISTS (
            -- Don't add if already in queue
            SELECT 1 FROM service_queue sq 
            WHERE sq.patient_visit_id = NEW.patient_visit_id 
            AND sq.service_id = s.id
          )
      LOOP
        -- Add the patient to this service queue with 'waiting' status
        INSERT INTO service_queue (
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add patients to queues when they complete "Know Your Numbers"
CREATE TRIGGER trigger_know_your_numbers_completion
  AFTER UPDATE ON service_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_know_your_numbers_completion();