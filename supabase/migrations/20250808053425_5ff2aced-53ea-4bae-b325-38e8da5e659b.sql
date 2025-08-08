-- Add optician intake fields to patients table
ALTER TABLE public.patients 
ADD COLUMN wears_glasses boolean DEFAULT false,
ADD COLUMN wears_contacts boolean DEFAULT false,
ADD COLUMN eye_symptoms text[], -- Array for multiple symptoms
ADD COLUMN eye_injury_history text,
ADD COLUMN eye_surgery_history text,
ADD COLUMN family_eye_history jsonb; -- Store family history as JSON

-- Create index for better query performance
CREATE INDEX idx_patients_eye_symptoms ON public.patients USING GIN(eye_symptoms);
CREATE INDEX idx_patients_family_eye_history ON public.patients USING GIN(family_eye_history);