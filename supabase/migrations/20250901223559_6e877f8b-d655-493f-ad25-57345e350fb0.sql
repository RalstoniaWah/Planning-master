-- Make birth_date optional in employees table and process existing signups

-- First, make birth_date nullable
ALTER TABLE employees ALTER COLUMN birth_date DROP NOT NULL;

-- Now process existing signups that have invitations but no employee records
DO $$
DECLARE
    invitation_rec RECORD;
    profile_rec RECORD;
    company_owner_id UUID;
    default_status_id UUID;
BEGIN
    -- Process each invitation that has a matching profile but hasn't been marked as used
    FOR invitation_rec IN 
        SELECT i.* 
        FROM invitations i
        JOIN profiles p ON p.email = i.email
        WHERE i.is_used = false 
        AND i.role = 'EMPLOYEE'
        AND i.employee_data IS NOT NULL
    LOOP
        RAISE LOG 'Processing invitation for: %', invitation_rec.email;
        
        company_owner_id := invitation_rec.invited_by;
        
        -- Get or create a default status for this company
        SELECT id INTO default_status_id 
        FROM employee_statuses 
        WHERE user_id = company_owner_id 
        LIMIT 1;
        
        -- If no status exists, create a default one
        IF default_status_id IS NULL THEN
            INSERT INTO employee_statuses (user_id, code, label, color, hours_limits, is_student)
            VALUES (company_owner_id, 'EMPLOYEE', 'Employé', '#3B82F6', '{"weekly": 40, "monthly": 160, "yearly": 1920}', false)
            RETURNING id INTO default_status_id;
        END IF;
        
        -- Create the employee record
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
            company_owner_id, -- Employee belongs to the company owner
            COALESCE((invitation_rec.employee_data->>'employee_number'), 'EMP' || extract(epoch from now())::text),
            invitation_rec.first_name,
            invitation_rec.last_name,
            invitation_rec.email,
            invitation_rec.employee_data->>'phone',
            CASE 
                WHEN invitation_rec.employee_data->>'birth_date' IS NOT NULL AND invitation_rec.employee_data->>'birth_date' != ''
                THEN (invitation_rec.employee_data->>'birth_date')::date
                ELSE NULL
            END,
            default_status_id,
            (invitation_rec.employee_data->>'contract_type')::text,
            COALESCE((invitation_rec.employee_data->>'hourly_rate')::numeric, 0),
            COALESCE((invitation_rec.employee_data->>'weekly_hours')::integer, 40),
            COALESCE((invitation_rec.employee_data->>'language')::text, 'FR'),
            COALESCE((invitation_rec.employee_data->>'color')::text, '#3B82F6'),
            true
        );
        
        -- Update the profile role to EMPLOYEE
        UPDATE profiles 
        SET role = 'EMPLOYEE', 
            invited_by = invitation_rec.invited_by,
            first_name = invitation_rec.first_name,
            last_name = invitation_rec.last_name
        WHERE email = invitation_rec.email;
        
        -- Mark invitation as used
        UPDATE invitations 
        SET is_used = true, used_at = now()
        WHERE id = invitation_rec.id;
        
        RAISE LOG 'Created employee and updated profile for: %', invitation_rec.email;
    END LOOP;
END $$;