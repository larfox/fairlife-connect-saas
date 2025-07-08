-- Create locations table
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  capacity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  license_number TEXT UNIQUE,
  specialization TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nurses table
CREATE TABLE public.nurses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  license_number TEXT UNIQUE,
  certification_level TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nurses ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage all records
-- Locations policies
CREATE POLICY "Authenticated users can view locations" 
ON public.locations FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert locations" 
ON public.locations FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update locations" 
ON public.locations FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete locations" 
ON public.locations FOR DELETE 
TO authenticated USING (true);

-- Services policies
CREATE POLICY "Authenticated users can view services" 
ON public.services FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert services" 
ON public.services FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update services" 
ON public.services FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete services" 
ON public.services FOR DELETE 
TO authenticated USING (true);

-- Doctors policies
CREATE POLICY "Authenticated users can view doctors" 
ON public.doctors FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert doctors" 
ON public.doctors FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update doctors" 
ON public.doctors FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete doctors" 
ON public.doctors FOR DELETE 
TO authenticated USING (true);

-- Nurses policies
CREATE POLICY "Authenticated users can view nurses" 
ON public.nurses FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert nurses" 
ON public.nurses FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update nurses" 
ON public.nurses FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete nurses" 
ON public.nurses FOR DELETE 
TO authenticated USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nurses_updated_at
BEFORE UPDATE ON public.nurses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();