-- Create parish table
CREATE TABLE public.parishes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create town table
CREATE TABLE public.towns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parish_id UUID NOT NULL REFERENCES public.parishes(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health fair events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location_id UUID NOT NULL REFERENCES public.locations(id),
  event_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to patients table and remove address
ALTER TABLE public.patients 
  DROP COLUMN address,
  ADD COLUMN town_id UUID REFERENCES public.towns(id),
  ADD COLUMN parish_id UUID REFERENCES public.parishes(id),
  ADD COLUMN event_id UUID REFERENCES public.events(id);

-- Enable RLS on new tables
ALTER TABLE public.parishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.towns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for parishes (read-only for authenticated users)
CREATE POLICY "Authenticated users can view parishes" 
ON public.parishes FOR SELECT 
TO authenticated USING (true);

-- Create policies for towns (read-only for authenticated users)
CREATE POLICY "Authenticated users can view towns" 
ON public.towns FOR SELECT 
TO authenticated USING (true);

-- Create policies for events
CREATE POLICY "Authenticated users can view events" 
ON public.events FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert events" 
ON public.events FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update events" 
ON public.events FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete events" 
ON public.events FOR DELETE 
TO authenticated USING (true);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_parishes_updated_at
BEFORE UPDATE ON public.parishes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_towns_updated_at
BEFORE UPDATE ON public.towns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample parishes and towns
INSERT INTO public.parishes (name) VALUES 
  ('Kingston'),
  ('St. Andrew'),
  ('St. Catherine'),
  ('Clarendon'),
  ('Manchester'),
  ('St. Elizabeth'),
  ('Westmoreland'),
  ('Hanover'),
  ('St. James'),
  ('Trelawny'),
  ('St. Ann'),
  ('St. Mary'),
  ('Portland'),
  ('St. Thomas');

-- Insert some sample towns (for Kingston and St. Andrew as examples)
INSERT INTO public.towns (name, parish_id) 
SELECT 'Downtown Kingston', id FROM public.parishes WHERE name = 'Kingston'
UNION ALL
SELECT 'New Kingston', id FROM public.parishes WHERE name = 'Kingston'
UNION ALL
SELECT 'Half Way Tree', id FROM public.parishes WHERE name = 'St. Andrew'
UNION ALL
SELECT 'Liguanea', id FROM public.parishes WHERE name = 'St. Andrew'
UNION ALL
SELECT 'Cross Roads', id FROM public.parishes WHERE name = 'St. Andrew';