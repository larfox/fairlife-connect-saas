-- Add town_name column to patients table to support custom town entries
ALTER TABLE public.patients 
ADD COLUMN town_name text;