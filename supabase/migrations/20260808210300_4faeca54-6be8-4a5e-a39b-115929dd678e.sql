REVOKE ALL ON FUNCTION public.assign_patient_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_patient_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_know_your_numbers_completion() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.assign_patient_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_patient_number() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_know_your_numbers_completion() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;