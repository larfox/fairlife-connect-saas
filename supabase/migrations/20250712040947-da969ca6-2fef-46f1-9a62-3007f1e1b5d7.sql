-- Add oxygen_saturation column to basic_screening table
ALTER TABLE public.basic_screening 
ADD COLUMN oxygen_saturation INTEGER;

-- Update the existing screening save function to handle all fields properly