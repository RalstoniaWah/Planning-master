-- Add interim contract type to employees table
DO $$ 
BEGIN
  -- Check if contract_type column exists and add INTERIM if not already present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%contract_type%' 
    AND check_clause LIKE '%INTERIM%'
  ) THEN
    -- First, let's see current values to avoid errors
    UPDATE employees SET contract_type = 'CDI' WHERE contract_type NOT IN ('CDI', 'CDD', 'INTERIM');
    
    -- Add check constraint that includes INTERIM
    ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_contract_type_check;
    ALTER TABLE employees ADD CONSTRAINT employees_contract_type_check 
    CHECK (contract_type IN ('CDI', 'CDD', 'INTERIM'));
  END IF;
END $$;

-- Add remaining leave days to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS remaining_leave_days integer DEFAULT 25;

-- Add comment for clarity
COMMENT ON COLUMN employees.remaining_leave_days IS 'Number of remaining vacation days for the current year';