CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.staff s WHERE s.is_active = true
    AND (s.user_id = auth.uid() OR lower(s.email) = lower(auth.jwt() ->> 'email')))
$$;
CREATE OR REPLACE FUNCTION public.is_staff_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.staff s WHERE s.is_active = true AND s.is_admin = true
    AND (s.user_id = auth.uid() OR lower(s.email) = lower(auth.jwt() ->> 'email')))
$$;
REVOKE EXECUTE ON FUNCTION public.is_active_staff() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff_admin() TO authenticated, service_role;

DO $$
DECLARE t text; p record;
  tbls text[] := ARRAY['patient_complaints','event_services','event_doctors','ecg_results','service_prices','patient_prognosis','pap_smear_assessments','event_nurses','immunizations','patient_visits','service_queue','nurses','events','prescriptions','doctors','optician_assessments','basic_screening','patients','locations','services','dental_assessments','towns','staff','staff_service_permissions'];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, t);
    END LOOP;
    IF t IN ('staff','staff_service_permissions') THEN
      EXECUTE format('CREATE POLICY "Active staff can view" ON public.%I FOR SELECT TO authenticated USING (public.is_active_staff())', t);
      EXECUTE format('CREATE POLICY "Admins can insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_staff_admin())', t);
      EXECUTE format('CREATE POLICY "Admins can update" ON public.%I FOR UPDATE TO authenticated USING (public.is_staff_admin()) WITH CHECK (public.is_staff_admin())', t);
      EXECUTE format('CREATE POLICY "Admins can delete" ON public.%I FOR DELETE TO authenticated USING (public.is_staff_admin())', t);
    ELSE
      EXECUTE format('CREATE POLICY "Active staff can view" ON public.%I FOR SELECT TO authenticated USING (public.is_active_staff())', t);
      EXECUTE format('CREATE POLICY "Active staff can insert" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_active_staff())', t);
      EXECUTE format('CREATE POLICY "Active staff can update" ON public.%I FOR UPDATE TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff())', t);
      EXECUTE format('CREATE POLICY "Active staff can delete" ON public.%I FOR DELETE TO authenticated USING (public.is_active_staff())', t);
    END IF;
  END LOOP;
END $$;