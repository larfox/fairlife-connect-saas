-- Add cholesterol field to basic_screening table
ALTER TABLE public.basic_screening 
ADD COLUMN cholesterol integer;