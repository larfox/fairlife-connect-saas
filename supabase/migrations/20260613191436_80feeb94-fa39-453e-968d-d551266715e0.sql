
-- pap_smear_assessments: restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can delete PAP smear assessments" ON public.pap_smear_assessments;
DROP POLICY IF EXISTS "Authenticated users can create PAP smear assessments" ON public.pap_smear_assessments;
DROP POLICY IF EXISTS "Authenticated users can view PAP smear assessments" ON public.pap_smear_assessments;
DROP POLICY IF EXISTS "Authenticated users can update PAP smear assessments" ON public.pap_smear_assessments;

CREATE POLICY "Authenticated users can view PAP smear assessments" ON public.pap_smear_assessments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create PAP smear assessments" ON public.pap_smear_assessments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update PAP smear assessments" ON public.pap_smear_assessments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete PAP smear assessments" ON public.pap_smear_assessments FOR DELETE TO authenticated USING (true);

-- staff: restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can delete staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can create staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can view staff" ON public.staff;
DROP POLICY IF EXISTS "Authenticated users can update staff" ON public.staff;

CREATE POLICY "Authenticated users can view staff" ON public.staff FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create staff" ON public.staff FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update staff" ON public.staff FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete staff" ON public.staff FOR DELETE TO authenticated USING (true);

-- staff_service_permissions: restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can delete staff permissions" ON public.staff_service_permissions;
DROP POLICY IF EXISTS "Authenticated users can create staff permissions" ON public.staff_service_permissions;
DROP POLICY IF EXISTS "Authenticated users can view staff permissions" ON public.staff_service_permissions;
DROP POLICY IF EXISTS "Authenticated users can update staff permissions" ON public.staff_service_permissions;

CREATE POLICY "Authenticated users can view staff permissions" ON public.staff_service_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create staff permissions" ON public.staff_service_permissions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update staff permissions" ON public.staff_service_permissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete staff permissions" ON public.staff_service_permissions FOR DELETE TO authenticated USING (true);

-- towns: restrict write policies to authenticated
DROP POLICY IF EXISTS "Authenticated users can insert towns" ON public.towns;
DROP POLICY IF EXISTS "Authenticated users can update towns" ON public.towns;
DROP POLICY IF EXISTS "Authenticated users can delete towns" ON public.towns;

CREATE POLICY "Authenticated users can insert towns" ON public.towns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update towns" ON public.towns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete towns" ON public.towns FOR DELETE TO authenticated USING (true);

-- Harden mutable search_path function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
