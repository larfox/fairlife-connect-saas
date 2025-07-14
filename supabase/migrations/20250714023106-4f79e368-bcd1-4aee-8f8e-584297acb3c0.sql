-- Create immunizations table
CREATE TABLE public.immunizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_visit_id UUID NOT NULL,
  vaccine_name TEXT NOT NULL,
  dose_number INTEGER,
  vaccine_date DATE,
  administered_by UUID,
  lot_number TEXT,
  expiration_date DATE,
  site_of_injection TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.immunizations ENABLE ROW LEVEL SECURITY;

-- Create policies for immunizations
CREATE POLICY "Authenticated users can view immunizations" 
ON public.immunizations 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create immunizations" 
ON public.immunizations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update immunizations" 
ON public.immunizations 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete immunizations" 
ON public.immunizations 
FOR DELETE 
USING (true);

-- Add foreign key relationships
ALTER TABLE public.immunizations 
ADD CONSTRAINT immunizations_patient_visit_id_fkey 
FOREIGN KEY (patient_visit_id) REFERENCES public.patient_visits(id);

ALTER TABLE public.immunizations 
ADD CONSTRAINT immunizations_administered_by_fkey 
FOREIGN KEY (administered_by) REFERENCES public.doctors(id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_immunizations_updated_at
BEFORE UPDATE ON public.immunizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();