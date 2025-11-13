-- Create default status and employee record

-- First create a default employee status if none exists
INSERT INTO employee_statuses (user_id, code, label, color, hours_limits, is_student)
VALUES ('ecbd2b48-cf33-4d57-bbcf-22c1394a75ea', 'INTERN', 'Stagiaire', '#FF9500', '{"weekly": 40, "monthly": 160, "yearly": 1920}', false)
ON CONFLICT DO NOTHING;

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
    (SELECT id FROM employee_statuses WHERE user_id = 'ecbd2b48-cf33-4d57-bbcf-22c1394a75ea' AND code = 'INTERN' LIMIT 1),
    'INTERN',
    0,
    40,
    'FR',
    '#3B82F6',
    true
);

-- Create employee record for td_abdl@hotmail.com (the other user)
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
    'EMP1756765908950',
    'ddd',
    'eeeee', 
    'td_abdl@hotmail.com',
    NULL,
    '1995-12-12', -- Has birth date
    (SELECT id FROM employee_statuses WHERE user_id = 'ecbd2b48-cf33-4d57-bbcf-22c1394a75ea' AND code = 'INTERN' LIMIT 1),
    'CDI',
    0,
    40,
    'FR',
    '#3B82F6',
    true
);

-- Update the profile roles to EMPLOYEE
UPDATE profiles 
SET role = 'EMPLOYEE', 
    invited_by = 'ecbd2b48-cf33-4d57-bbcf-22c1394a75ea',
    first_name = 'dezdez',
    last_name = 'eeeee'
WHERE email = 'tdf.abdl@gmail.com';

UPDATE profiles 
SET role = 'EMPLOYEE', 
    invited_by = 'ecbd2b48-cf33-4d57-bbcf-22c1394a75ea',
    first_name = 'ddd',
    last_name = 'eeeee'
WHERE email = 'td_abdl@hotmail.com';

-- Mark the invitations as used
UPDATE invitations 
SET is_used = true, used_at = now()
WHERE email IN ('tdf.abdl@gmail.com', 'td_abdl@hotmail.com') AND is_used = false;