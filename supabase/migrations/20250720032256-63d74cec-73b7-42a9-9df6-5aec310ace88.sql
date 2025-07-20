-- Create PAP smear assessments table
CREATE TABLE public.pap_smear_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_visit_id UUID NOT NULL,
  performed_by_doctor_id UUID,
  performed_by_nurse_id UUID,
  assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  comments TEXT,
  findings TEXT,
  recommendations TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pap_smear_assessments ENABLE ROW LEVEL SECURITY;

-- Create policies for PAP smear assessments
CREATE POLICY "Authenticated users can view PAP smear assessments" 
ON public.pap_smear_assessments 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create PAP smear assessments" 
ON public.pap_smear_assessments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update PAP smear assessments" 
ON public.pap_smear_assessments 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete PAP smear assessments" 
ON public.pap_smear_assessments 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pap_smear_assessments_updated_at
BEFORE UPDATE ON public.pap_smear_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();