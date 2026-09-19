CREATE TABLE public.service_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE UNIQUE,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_prices TO authenticated;
GRANT ALL ON public.service_prices TO service_role;

ALTER TABLE public.service_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view service prices" ON public.service_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can add service prices" ON public.service_prices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update service prices" ON public.service_prices FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete service prices" ON public.service_prices FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_service_prices_updated_at BEFORE UPDATE ON public.service_prices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();