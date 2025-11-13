-- Manually create employee records for specific users who signed up

-- Ensure birth_date is nullable
ALTER TABLE employees ALTER COLUMN birth_date DROP NOT NULL;

-- Create employee record for tdf.abdl@gmail.com
INSERT INTO employees (
    user_id,
    employee_number,
    first_name,
    last_name,
    email,
    phone,
    birth_date,
    status_id,
    contract_type,
    hourly_rate,
    weekly_hours,
    language,
    color,
    active
) VALUES (
    'ecbd2b48-cf33-4d57-bbcf-22c1394a75ea', -- Company owner ID
    'EMP1756765974295',
    'dezdez',
    'eeeee', 
    'tdf.abdl@gmail.com',
    '+32485459882',
    NULL, -- birth_date is NULL
    (SELECT id FROM employee_statuses WHERE user_id = 'ecbd2b48-cf33-4d57-bbcf-22c1394a75ea' LIMIT 1),
    'INTERN',
    0,
    40,
    'FR',
    '#3B82F6',
    true
);

-- Update the profile role to EMPLOYEE
UPDATE profiles 
SET role = 'EMPLOYEE', 
    invited_by = 'ecbd2b48-cf33-4d57-bbcf-22c1394a75ea',
    first_name = 'dezdez',
    last_name = 'eeeee'
WHERE email = 'tdf.abdl@gmail.com';

-- Mark the invitation as used
UPDATE invitations 
SET is_used = true, used_at = now()
WHERE email = 'tdf.abdl@gmail.com' AND is_used = false;