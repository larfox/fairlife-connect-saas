-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_conditions TEXT,
  allergies TEXT,
  medications TEXT,
  insurance_provider TEXT,
  insurance_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage all records
CREATE POLICY "Authenticated users can view patients" 
ON public.patients FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert patients" 
ON public.patients FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients" 
ON public.patients FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete patients" 
ON public.patients FOR DELETE 
TO authenticated USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();