-- Add status column to events table
ALTER TABLE public.events 
ADD COLUMN status text DEFAULT 'open' CHECK (status IN ('open', 'pending', 'closed'));

-- Create index for better query performance
CREATE INDEX idx_events_status ON public.events(status);

-- Update existing events based on is_active column
UPDATE public.events 
SET status = CASE 
  WHEN is_active = true THEN 'open'
  WHEN is_active = false THEN 'closed'
  ELSE 'open'
END;