-- Create patient queue system tables

-- Create patient visits table to track each visit to an event
CREATE TABLE public.patient_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  queue_number INTEGER NOT NULL,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  basic_screening_completed BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'checked_in' CHECK (status IN ('checked_in', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, queue_number)
);

-- Create service queue table to track patient progress through services
CREATE TABLE public.service_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_visit_id UUID NOT NULL REFERENCES patient_visits(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id),
  nurse_id UUID REFERENCES nurses(id),
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'skipped')),
  queue_position INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_visit_id, service_id)
);

-- Create patient complaints table
CREATE TABLE public.patient_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_visit_id UUID NOT NULL REFERENCES patient_visits(id) ON DELETE CASCADE,
  complaint_text TEXT NOT NULL,
  severity TEXT DEFAULT 'mild' CHECK (severity IN ('mild', 'moderate', 'severe')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient prognosis table
CREATE TABLE public.patient_prognosis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_visit_id UUID NOT NULL REFERENCES patient_visits(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id),
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create basic screening results table
CREATE TABLE public.basic_screening (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_visit_id UUID NOT NULL REFERENCES patient_visits(id) ON DELETE CASCADE,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  temperature DECIMAL(4,1),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  bmi DECIMAL(4,1),
  blood_sugar INTEGER,
  notes TEXT,
  screened_by UUID REFERENCES nurses(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add patient number field to patients table
ALTER TABLE public.patients 
ADD COLUMN patient_number VARCHAR(20) UNIQUE;

-- Create function to generate patient numbers
CREATE OR REPLACE FUNCTION generate_patient_number()
RETURNS VARCHAR(20) AS $$
DECLARE
  new_number VARCHAR(20);
  counter INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(patient_number FROM 2) AS INTEGER)), 0) + 1
  INTO counter
  FROM patients
  WHERE patient_number IS NOT NULL AND patient_number ~ '^P[0-9]+$';
  
  new_number := 'P' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-assign patient numbers
CREATE OR REPLACE FUNCTION assign_patient_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.patient_number IS NULL THEN
    NEW.patient_number := generate_patient_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_patient_number
  BEFORE INSERT ON patients
  FOR EACH ROW
  EXECUTE FUNCTION assign_patient_number();

-- Create indexes for better performance
CREATE INDEX idx_patient_visits_event_id ON patient_visits(event_id);
CREATE INDEX idx_patient_visits_patient_id ON patient_visits(patient_id);
CREATE INDEX idx_service_queue_patient_visit_id ON service_queue(patient_visit_id);
CREATE INDEX idx_service_queue_service_id ON service_queue(service_id);
CREATE INDEX idx_service_queue_status ON service_queue(status);
CREATE INDEX idx_patient_number ON patients(patient_number);

-- Enable Row Level Security
ALTER TABLE patient_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_prognosis ENABLE ROW LEVEL SECURITY;
ALTER TABLE basic_screening ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view patient visits" 
ON patient_visits FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create patient visits" 
ON patient_visits FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient visits" 
ON patient_visits FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete patient visits" 
ON patient_visits FOR DELETE USING (true);

CREATE POLICY "Authenticated users can view service queue" 
ON service_queue FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create service queue" 
ON service_queue FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update service queue" 
ON service_queue FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete service queue" 
ON service_queue FOR DELETE USING (true);

CREATE POLICY "Authenticated users can view patient complaints" 
ON patient_complaints FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create patient complaints" 
ON patient_complaints FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient complaints" 
ON patient_complaints FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete patient complaints" 
ON patient_complaints FOR DELETE USING (true);

CREATE POLICY "Authenticated users can view patient prognosis" 
ON patient_prognosis FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create patient prognosis" 
ON patient_prognosis FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient prognosis" 
ON patient_prognosis FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete patient prognosis" 
ON patient_prognosis FOR DELETE USING (true);

CREATE POLICY "Authenticated users can view basic screening" 
ON basic_screening FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create basic screening" 
ON basic_screening FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can update basic screening" 
ON basic_screening FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can delete basic screening" 
ON basic_screening FOR DELETE USING (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_patient_visits_updated_at
  BEFORE UPDATE ON patient_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_queue_updated_at
  BEFORE UPDATE ON service_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_complaints_updated_at
  BEFORE UPDATE ON patient_complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_prognosis_updated_at
  BEFORE UPDATE ON patient_prognosis
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_basic_screening_updated_at
  BEFORE UPDATE ON basic_screening
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();