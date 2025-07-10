-- Add more towns for all parishes
INSERT INTO public.towns (name, parish_id) 
SELECT 'Spanish Town', id FROM public.parishes WHERE name = 'St. Catherine'
UNION ALL
SELECT 'Portmore', id FROM public.parishes WHERE name = 'St. Catherine'
UNION ALL
SELECT 'Old Harbour', id FROM public.parishes WHERE name = 'St. Catherine'
UNION ALL
SELECT 'May Pen', id FROM public.parishes WHERE name = 'Clarendon'
UNION ALL
SELECT 'Chapelton', id FROM public.parishes WHERE name = 'Clarendon'
UNION ALL
SELECT 'Mandeville', id FROM public.parishes WHERE name = 'Manchester'
UNION ALL
SELECT 'Christiana', id FROM public.parishes WHERE name = 'Manchester'
UNION ALL
SELECT 'Black River', id FROM public.parishes WHERE name = 'St. Elizabeth'
UNION ALL
SELECT 'Santa Cruz', id FROM public.parishes WHERE name = 'St. Elizabeth'
UNION ALL
SELECT 'Savanna-la-Mar', id FROM public.parishes WHERE name = 'Westmoreland'
UNION ALL
SELECT 'Negril', id FROM public.parishes WHERE name = 'Westmoreland'
UNION ALL
SELECT 'Lucea', id FROM public.parishes WHERE name = 'Hanover'
UNION ALL
SELECT 'Montego Bay', id FROM public.parishes WHERE name = 'St. James'
UNION ALL
SELECT 'Falmouth', id FROM public.parishes WHERE name = 'Trelawny'
UNION ALL
SELECT 'Ocho Rios', id FROM public.parishes WHERE name = 'St. Ann'
UNION ALL
SELECT 'Port Maria', id FROM public.parishes WHERE name = 'St. Mary'
UNION ALL
SELECT 'Port Antonio', id FROM public.parishes WHERE name = 'Portland'
UNION ALL
SELECT 'Morant Bay', id FROM public.parishes WHERE name = 'St. Thomas';

-- Create sample events linked to existing locations
-- First, let's insert some sample events if there are locations available
INSERT INTO public.events (name, location_id, event_date, start_time, end_time, description)
SELECT 
  'Community Health Fair - ' || l.name,
  l.id,
  CURRENT_DATE + INTERVAL '7 days',
  '09:00:00',
  '16:00:00',
  'Free health screenings, vaccinations, and medical consultations for the community at ' || l.name
FROM public.locations l
WHERE l.is_active = true
LIMIT 3;

-- If no locations exist, create a sample location and event
INSERT INTO public.locations (name, address, capacity, phone, email)
SELECT 'Community Center Kingston', '123 Main Street, Kingston', 100, '876-555-0123', 'info@communitycenter.com'
WHERE NOT EXISTS (SELECT 1 FROM public.locations WHERE name = 'Community Center Kingston');

-- Create an event for the new location if it was just created
INSERT INTO public.events (name, location_id, event_date, start_time, end_time, description)
SELECT 
  'Kingston Health Fair 2025',
  l.id,
  CURRENT_DATE + INTERVAL '14 days',
  '08:00:00',
  '17:00:00',
  'Annual community health fair providing free medical services, health screenings, and wellness education.'
FROM public.locations l
WHERE l.name = 'Community Center Kingston'
AND NOT EXISTS (SELECT 1 FROM public.events e WHERE e.name = 'Kingston Health Fair 2025');