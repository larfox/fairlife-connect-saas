-- Remove the foreign key constraint to nurses table
ALTER TABLE basic_screening DROP CONSTRAINT IF EXISTS basic_screening_screened_by_fkey;

-- Add foreign key constraint to staff table instead
ALTER TABLE basic_screening 
ADD CONSTRAINT basic_screening_screened_by_fkey 
FOREIGN KEY (screened_by) REFERENCES staff(id);