-- Drop the existing check constraint on shifts status
ALTER TABLE public.shifts DROP CONSTRAINT IF EXISTS shifts_status_check;

-- Add the new check constraint with the correct status values
ALTER TABLE public.shifts ADD CONSTRAINT shifts_status_check 
CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'PUBLISHED', 'COMPLETED'));