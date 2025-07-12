-- Add health professional assignment fields to relevant tables

-- Add screened_by field to basic_screening table (already exists)
-- Add doctor_id field to patient_prognosis table (already exists)

-- Create new tables for tracking health professional assignments per tab/service type

-- Table for optician assessments
CREATE TABLE public.optician_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_visit_id UUID NOT NULL,
  vision_test_results TEXT,
  eye_pressure DECIMAL,
  prescription_details TEXT,
  assessment_notes TEXT,
  optician_id UUID REFERENCES public.doctors(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for dental assessments  
CREATE TABLE public.dental_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_visit_id UUID NOT NULL,
  oral_health_assessment TEXT,
  teeth_condition TEXT,
  gum_health TEXT,
  recommendations TEXT,
  assessment_notes TEXT,
  dental_professional_id UUID REFERENCES public.doctors(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for prescriptions
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_visit_id UUID NOT NULL,
  medication TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  duration TEXT,
  instructions TEXT,
  prescribed_by UUID REFERENCES public.doctors(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for ECG results
CREATE TABLE public.ecg_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_visit_id UUID NOT NULL,
  result TEXT,
  interpretation TEXT,
  notes TEXT,
  performed_by UUID REFERENCES public.doctors(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.optician_assessments 
ADD CONSTRAINT optician_assessments_patient_visit_id_fkey 
FOREIGN KEY (patient_visit_id) REFERENCES public.patient_visits(id) ON DELETE CASCADE;

ALTER TABLE public.dental_assessments 
ADD CONSTRAINT dental_assessments_patient_visit_id_fkey 
FOREIGN KEY (patient_visit_id) REFERENCES public.patient_visits(id) ON DELETE CASCADE;

ALTER TABLE public.prescriptions 
ADD CONSTRAINT prescriptions_patient_visit_id_fkey 
FOREIGN KEY (patient_visit_id) REFERENCES public.patient_visits(id) ON DELETE CASCADE;

ALTER TABLE public.ecg_results 
ADD CONSTRAINT ecg_results_patient_visit_id_fkey 
FOREIGN KEY (patient_visit_id) REFERENCES public.patient_visits(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.optician_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecg_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view optician assessments" 
ON public.optician_assessments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert optician assessments" 
ON public.optician_assessments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update optician assessments" 
ON public.optician_assessments FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete optician assessments" 
ON public.optician_assessments FOR DELETE 
USING (true);

CREATE POLICY "Authenticated users can view dental assessments" 
ON public.dental_assessments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert dental assessments" 
ON public.dental_assessments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update dental assessments" 
ON public.dental_assessments FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete dental assessments" 
ON public.dental_assessments FOR DELETE 
USING (true);

CREATE POLICY "Authenticated users can view prescriptions" 
ON public.prescriptions FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert prescriptions" 
ON public.prescriptions FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update prescriptions" 
ON public.prescriptions FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete prescriptions" 
ON public.prescriptions FOR DELETE 
USING (true);

CREATE POLICY "Authenticated users can view ecg results" 
ON public.ecg_results FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert ecg results" 
ON public.ecg_results FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update ecg results" 
ON public.ecg_results FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete ecg results" 
ON public.ecg_results FOR DELETE 
USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_optician_assessments_updated_at
BEFORE UPDATE ON public.optician_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dental_assessments_updated_at
BEFORE UPDATE ON public.dental_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at
BEFORE UPDATE ON public.prescriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ecg_results_updated_at
BEFORE UPDATE ON public.ecg_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add a field to track health professional assignments for complaints
ALTER TABLE public.patient_complaints 
ADD COLUMN assigned_professional_id UUID REFERENCES public.doctors(id);