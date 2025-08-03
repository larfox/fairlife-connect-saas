-- Remove PAP smear service queue entries for male patients
DELETE FROM public.service_queue 
WHERE service_id = 'c9ed76c5-86de-4661-9019-d35af0444a71' -- Paps Smears service ID
AND patient_visit_id IN (
  SELECT pv.id 
  FROM public.patient_visits pv
  JOIN public.patients p ON p.id = pv.patient_id
  WHERE p.gender = 'male'
);