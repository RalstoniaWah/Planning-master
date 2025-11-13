-- Add DRAFT status to shifts table constraint
ALTER TABLE shifts DROP CONSTRAINT IF EXISTS shifts_status_check;
ALTER TABLE shifts ADD CONSTRAINT shifts_status_check CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'PUBLISHED', 'COMPLETED'));