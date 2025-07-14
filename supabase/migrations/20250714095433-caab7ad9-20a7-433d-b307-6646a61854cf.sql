-- Create staff table for managing user access
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff_service_permissions table for service-based access
CREATE TABLE public.staff_service_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, service_id)
);

-- Enable Row Level Security
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_service_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies for staff table
CREATE POLICY "Authenticated users can view staff" 
ON public.staff 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create staff" 
ON public.staff 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update staff" 
ON public.staff 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete staff" 
ON public.staff 
FOR DELETE 
USING (true);

-- Create policies for staff_service_permissions table
CREATE POLICY "Authenticated users can view staff permissions" 
ON public.staff_service_permissions 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create staff permissions" 
ON public.staff_service_permissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update staff permissions" 
ON public.staff_service_permissions 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete staff permissions" 
ON public.staff_service_permissions 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON public.staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing doctors as staff (non-admin by default)
INSERT INTO public.staff (first_name, last_name, email, phone, is_admin, is_active)
SELECT 
  first_name, 
  last_name, 
  COALESCE(email, first_name || '.' || last_name || '@healthfair.local') as email,
  phone,
  false as is_admin,
  is_active
FROM public.doctors
WHERE is_active = true
ON CONFLICT (email) DO NOTHING;

-- Insert existing nurses as staff (non-admin by default)
INSERT INTO public.staff (first_name, last_name, email, phone, is_admin, is_active)
SELECT 
  first_name, 
  last_name, 
  COALESCE(email, first_name || '.' || last_name || '@healthfair.local') as email,
  phone,
  false as is_admin,
  is_active
FROM public.nurses
WHERE is_active = true
ON CONFLICT (email) DO NOTHING;