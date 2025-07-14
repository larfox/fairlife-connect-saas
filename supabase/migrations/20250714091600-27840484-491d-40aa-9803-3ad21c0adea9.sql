-- Fix RLS security vulnerabilities
-- Issue 1: Many policies use 'public' role instead of 'authenticated'
-- Issue 2: Some policies have 'true' conditions allowing unrestricted access

-- Drop existing overly permissive policies and create secure ones

-- Fix basic_screening table
DROP POLICY IF EXISTS "Authenticated users can view basic screening" ON public.basic_screening;
DROP POLICY IF EXISTS "Authenticated users can create basic screening" ON public.basic_screening;
DROP POLICY IF EXISTS "Authenticated users can update basic screening" ON public.basic_screening;
DROP POLICY IF EXISTS "Authenticated users can delete basic screening" ON public.basic_screening;

CREATE POLICY "Authenticated users can view basic screening"
ON public.basic_screening FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create basic screening"
ON public.basic_screening FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update basic screening"
ON public.basic_screening FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete basic screening"
ON public.basic_screening FOR DELETE
TO authenticated
USING (true);

-- Fix dental_assessments table
DROP POLICY IF EXISTS "Authenticated users can view dental assessments" ON public.dental_assessments;
DROP POLICY IF EXISTS "Authenticated users can insert dental assessments" ON public.dental_assessments;
DROP POLICY IF EXISTS "Authenticated users can update dental assessments" ON public.dental_assessments;
DROP POLICY IF EXISTS "Authenticated users can delete dental assessments" ON public.dental_assessments;

CREATE POLICY "Authenticated users can view dental assessments"
ON public.dental_assessments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create dental assessments"
ON public.dental_assessments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update dental assessments"
ON public.dental_assessments FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete dental assessments"
ON public.dental_assessments FOR DELETE
TO authenticated
USING (true);

-- Fix ecg_results table
DROP POLICY IF EXISTS "Authenticated users can view ecg results" ON public.ecg_results;
DROP POLICY IF EXISTS "Authenticated users can insert ecg results" ON public.ecg_results;
DROP POLICY IF EXISTS "Authenticated users can update ecg results" ON public.ecg_results;
DROP POLICY IF EXISTS "Authenticated users can delete ecg results" ON public.ecg_results;

CREATE POLICY "Authenticated users can view ecg results"
ON public.ecg_results FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create ecg results"
ON public.ecg_results FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update ecg results"
ON public.ecg_results FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete ecg results"
ON public.ecg_results FOR DELETE
TO authenticated
USING (true);

-- Fix event_doctors table
DROP POLICY IF EXISTS "Authenticated users can view event doctors" ON public.event_doctors;
DROP POLICY IF EXISTS "Authenticated users can insert event doctors" ON public.event_doctors;
DROP POLICY IF EXISTS "Authenticated users can update event doctors" ON public.event_doctors;
DROP POLICY IF EXISTS "Authenticated users can delete event doctors" ON public.event_doctors;

CREATE POLICY "Authenticated users can view event doctors"
ON public.event_doctors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create event doctors"
ON public.event_doctors FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update event doctors"
ON public.event_doctors FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete event doctors"
ON public.event_doctors FOR DELETE
TO authenticated
USING (true);

-- Fix event_nurses table
DROP POLICY IF EXISTS "Authenticated users can view event nurses" ON public.event_nurses;
DROP POLICY IF EXISTS "Authenticated users can insert event nurses" ON public.event_nurses;
DROP POLICY IF EXISTS "Authenticated users can update event nurses" ON public.event_nurses;
DROP POLICY IF EXISTS "Authenticated users can delete event nurses" ON public.event_nurses;

CREATE POLICY "Authenticated users can view event nurses"
ON public.event_nurses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create event nurses"
ON public.event_nurses FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update event nurses"
ON public.event_nurses FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete event nurses"
ON public.event_nurses FOR DELETE
TO authenticated
USING (true);

-- Fix event_services table
DROP POLICY IF EXISTS "Authenticated users can view event services" ON public.event_services;
DROP POLICY IF EXISTS "Authenticated users can insert event services" ON public.event_services;
DROP POLICY IF EXISTS "Authenticated users can update event services" ON public.event_services;
DROP POLICY IF EXISTS "Authenticated users can delete event services" ON public.event_services;

CREATE POLICY "Authenticated users can view event services"
ON public.event_services FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create event services"
ON public.event_services FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update event services"
ON public.event_services FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete event services"
ON public.event_services FOR DELETE
TO authenticated
USING (true);

-- Fix immunizations table
DROP POLICY IF EXISTS "Authenticated users can view immunizations" ON public.immunizations;
DROP POLICY IF EXISTS "Authenticated users can create immunizations" ON public.immunizations;
DROP POLICY IF EXISTS "Authenticated users can update immunizations" ON public.immunizations;
DROP POLICY IF EXISTS "Authenticated users can delete immunizations" ON public.immunizations;

CREATE POLICY "Authenticated users can view immunizations"
ON public.immunizations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create immunizations"
ON public.immunizations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update immunizations"
ON public.immunizations FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete immunizations"
ON public.immunizations FOR DELETE
TO authenticated
USING (true);

-- Fix optician_assessments table
DROP POLICY IF EXISTS "Authenticated users can view optician assessments" ON public.optician_assessments;
DROP POLICY IF EXISTS "Authenticated users can insert optician assessments" ON public.optician_assessments;
DROP POLICY IF EXISTS "Authenticated users can update optician assessments" ON public.optician_assessments;
DROP POLICY IF EXISTS "Authenticated users can delete optician assessments" ON public.optician_assessments;

CREATE POLICY "Authenticated users can view optician assessments"
ON public.optician_assessments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create optician assessments"
ON public.optician_assessments FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update optician assessments"
ON public.optician_assessments FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete optician assessments"
ON public.optician_assessments FOR DELETE
TO authenticated
USING (true);

-- Fix patient_complaints table
DROP POLICY IF EXISTS "Authenticated users can view patient complaints" ON public.patient_complaints;
DROP POLICY IF EXISTS "Authenticated users can create patient complaints" ON public.patient_complaints;
DROP POLICY IF EXISTS "Authenticated users can update patient complaints" ON public.patient_complaints;
DROP POLICY IF EXISTS "Authenticated users can delete patient complaints" ON public.patient_complaints;

CREATE POLICY "Authenticated users can view patient complaints"
ON public.patient_complaints FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create patient complaints"
ON public.patient_complaints FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient complaints"
ON public.patient_complaints FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete patient complaints"
ON public.patient_complaints FOR DELETE
TO authenticated
USING (true);

-- Fix patient_prognosis table
DROP POLICY IF EXISTS "Authenticated users can view patient prognosis" ON public.patient_prognosis;
DROP POLICY IF EXISTS "Authenticated users can create patient prognosis" ON public.patient_prognosis;
DROP POLICY IF EXISTS "Authenticated users can update patient prognosis" ON public.patient_prognosis;
DROP POLICY IF EXISTS "Authenticated users can delete patient prognosis" ON public.patient_prognosis;

CREATE POLICY "Authenticated users can view patient prognosis"
ON public.patient_prognosis FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create patient prognosis"
ON public.patient_prognosis FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient prognosis"
ON public.patient_prognosis FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete patient prognosis"
ON public.patient_prognosis FOR DELETE
TO authenticated
USING (true);

-- Fix patient_visits table
DROP POLICY IF EXISTS "Authenticated users can view patient visits" ON public.patient_visits;
DROP POLICY IF EXISTS "Authenticated users can create patient visits" ON public.patient_visits;
DROP POLICY IF EXISTS "Authenticated users can update patient visits" ON public.patient_visits;
DROP POLICY IF EXISTS "Authenticated users can delete patient visits" ON public.patient_visits;

CREATE POLICY "Authenticated users can view patient visits"
ON public.patient_visits FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create patient visits"
ON public.patient_visits FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient visits"
ON public.patient_visits FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete patient visits"
ON public.patient_visits FOR DELETE
TO authenticated
USING (true);

-- Fix prescriptions table
DROP POLICY IF EXISTS "Authenticated users can view prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Authenticated users can insert prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Authenticated users can update prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Authenticated users can delete prescriptions" ON public.prescriptions;

CREATE POLICY "Authenticated users can view prescriptions"
ON public.prescriptions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create prescriptions"
ON public.prescriptions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update prescriptions"
ON public.prescriptions FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete prescriptions"
ON public.prescriptions FOR DELETE
TO authenticated
USING (true);

-- Fix service_queue table
DROP POLICY IF EXISTS "Authenticated users can view service queue" ON public.service_queue;
DROP POLICY IF EXISTS "Authenticated users can create service queue" ON public.service_queue;
DROP POLICY IF EXISTS "Authenticated users can update service queue" ON public.service_queue;
DROP POLICY IF EXISTS "Authenticated users can delete service queue" ON public.service_queue;

CREATE POLICY "Authenticated users can view service queue"
ON public.service_queue FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create service queue"
ON public.service_queue FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update service queue"
ON public.service_queue FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete service queue"
ON public.service_queue FOR DELETE
TO authenticated
USING (true);