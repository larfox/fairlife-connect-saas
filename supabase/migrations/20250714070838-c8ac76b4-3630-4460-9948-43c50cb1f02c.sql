-- Clean up existing service queue data to enforce "Know Your Numbers" first rule
-- Remove patients from non-"Know Your Numbers" queues if they haven't completed "Know Your Numbers"

WITH kyn_service AS (
  SELECT id FROM services 
  WHERE LOWER(name) LIKE '%know your numbers%' 
  LIMIT 1
),
completed_kyn_patients AS (
  SELECT DISTINCT patient_visit_id 
  FROM service_queue sq
  CROSS JOIN kyn_service ks
  WHERE sq.service_id = ks.id 
  AND sq.status = 'completed'
)
DELETE FROM service_queue 
WHERE service_id NOT IN (SELECT id FROM kyn_service)
AND patient_visit_id NOT IN (SELECT patient_visit_id FROM completed_kyn_patients);