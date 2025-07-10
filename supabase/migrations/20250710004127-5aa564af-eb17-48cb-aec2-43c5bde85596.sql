-- Create junction tables to link events with staff and services

-- Table to link events with doctors
CREATE TABLE public.event_doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'attending', -- role of doctor in this event
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, doctor_id)
);

-- Table to link events with nurses  
CREATE TABLE public.event_nurses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  nurse_id UUID NOT NULL REFERENCES public.nurses(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff', -- role of nurse in this event
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, nurse_id)
);

-- Table to link events with services
CREATE TABLE public.event_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, service_id)
);

-- Enable Row Level Security for all junction tables
ALTER TABLE public.event_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_nurses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for event_doctors
CREATE POLICY "Authenticated users can view event doctors" 
ON public.event_doctors 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert event doctors" 
ON public.event_doctors 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update event doctors" 
ON public.event_doctors 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete event doctors" 
ON public.event_doctors 
FOR DELETE 
USING (true);

-- Create RLS policies for event_nurses
CREATE POLICY "Authenticated users can view event nurses" 
ON public.event_nurses 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert event nurses" 
ON public.event_nurses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update event nurses" 
ON public.event_nurses 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete event nurses" 
ON public.event_nurses 
FOR DELETE 
USING (true);

-- Create RLS policies for event_services
CREATE POLICY "Authenticated users can view event services" 
ON public.event_services 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert event services" 
ON public.event_services 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update event services" 
ON public.event_services 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete event services" 
ON public.event_services 
FOR DELETE 
USING (true);

-- Add triggers for updated_at columns
CREATE TRIGGER update_event_doctors_updated_at
BEFORE UPDATE ON public.event_doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_nurses_updated_at
BEFORE UPDATE ON public.event_nurses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();