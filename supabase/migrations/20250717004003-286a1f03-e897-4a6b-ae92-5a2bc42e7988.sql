-- Add professional_capacity field to staff table
ALTER TABLE public.staff ADD COLUMN professional_capacity text;

-- Create an enum for professional capacities
CREATE TYPE professional_capacity_enum AS ENUM (
  'doctor',
  'nurse', 
  'optician',
  'dentist',
  'dental_technician',
  'registration_technician',
  'administration'
);

-- Update the staff table to use the enum
ALTER TABLE public.staff ALTER COLUMN professional_capacity TYPE professional_capacity_enum USING professional_capacity::professional_capacity_enum;

-- Set a default value
ALTER TABLE public.staff ALTER COLUMN professional_capacity SET DEFAULT 'administration';

-- Update existing records to have a default value
UPDATE public.staff SET professional_capacity = 'administration' WHERE professional_capacity IS NULL;