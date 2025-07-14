-- Update the service_queue status check constraint to include 'unavailable'
ALTER TABLE service_queue DROP CONSTRAINT service_queue_status_check;

ALTER TABLE service_queue ADD CONSTRAINT service_queue_status_check 
CHECK (status = ANY (ARRAY['waiting'::text, 'in_progress'::text, 'completed'::text, 'skipped'::text, 'unavailable'::text]));