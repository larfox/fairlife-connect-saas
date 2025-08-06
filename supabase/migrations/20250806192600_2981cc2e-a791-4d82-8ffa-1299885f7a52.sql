-- Add RLS policies to allow authenticated users to insert new towns
CREATE POLICY "Authenticated users can insert towns" 
ON public.towns 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update towns" 
ON public.towns 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete towns" 
ON public.towns 
FOR DELETE 
USING (true);