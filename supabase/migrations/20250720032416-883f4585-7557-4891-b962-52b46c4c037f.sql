-- Add foreign key constraints to the PAP smear assessments table
ALTER TABLE public.pap_smear_assessments 
ADD CONSTRAINT fk_pap_smear_doctor 
FOREIGN KEY (performed_by_doctor_id) 
REFERENCES public.doctors(id);

ALTER TABLE public.pap_smear_assessments 
ADD CONSTRAINT fk_pap_smear_nurse 
FOREIGN KEY (performed_by_nurse_id) 
REFERENCES public.nurses(id);