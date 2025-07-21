-- Add tab permission columns to staff table
ALTER TABLE public.staff 
ADD COLUMN can_access_services_tab boolean DEFAULT false,
ADD COLUMN can_access_prognosis_tab boolean DEFAULT false,
ADD COLUMN can_access_prescriptions_tab boolean DEFAULT false;