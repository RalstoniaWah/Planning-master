-- Fix the handle_invitation_signup function to properly create employees from invitations

-- Drop the trigger first
DROP TRIGGER IF EXISTS on_auth_user_created_invitation ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Now drop the function
DROP FUNCTION IF EXISTS public.handle_invitation_signup() CASCADE;

-- Recreate the function with proper logic
CREATE OR REPLACE FUNCTION public.handle_invitation_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  invitation_record RECORD;
  company_owner_id UUID;
BEGIN
  -- Log the signup attempt
  RAISE LOG 'User signup attempt for email: %', NEW.email;
  
  -- Check if this user was invited
  SELECT * INTO invitation_record 
  FROM public.invitations 
  WHERE email = NEW.email 
    AND is_used = false 
    AND invitation_expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invitation_record IS NOT NULL THEN
    RAISE LOG 'Found invitation for user: %', NEW.email;
    
    -- Get the company owner ID (the person who sent the invitation)
    company_owner_id := invitation_record.invited_by;
    
    -- Create profile with invitation data
    INSERT INTO public.profiles (
      user_id,
      email,
      first_name,
      last_name,
      company_name,
      role,
      invited_by,
      is_active
    ) VALUES (
      NEW.id,
      NEW.email,
      invitation_record.first_name,
      invitation_record.last_name,
      invitation_record.company_name,
      invitation_record.role,
      invitation_record.invited_by,
      true
    );

    -- If it's an employee invitation, create employee record
    IF invitation_record.role = 'EMPLOYEE' AND invitation_record.employee_data IS NOT NULL THEN
      RAISE LOG 'Creating employee record for: %', NEW.email;
      
      -- We need a status_id, let's get a default one or create a basic status
      INSERT INTO public.employees (
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
        COALESCE((invitation_record.employee_data->>'employee_number'), 'EMP' || extract(epoch from now())::text),
        invitation_record.first_name,
        invitation_record.last_name,
        invitation_record.email,
        invitation_record.employee_data->>'phone',
        CASE 
          WHEN invitation_record.employee_data->>'birth_date' IS NOT NULL 
          THEN (invitation_record.employee_data->>'birth_date')::date
          ELSE NULL
        END,
        -- Get a default status_id from employee_statuses for this company
        (SELECT id FROM public.employee_statuses WHERE user_id = company_owner_id LIMIT 1),
        (invitation_record.employee_data->>'contract_type')::text,
        COALESCE((invitation_record.employee_data->>'hourly_rate')::numeric, 0),
        COALESCE((invitation_record.employee_data->>'weekly_hours')::integer, 40),
        COALESCE((invitation_record.employee_data->>'language')::text, 'FR'),
        COALESCE((invitation_record.employee_data->>'color')::text, '#3B82F6'),
        true
      );
    END IF;

    -- Mark invitation as used
    UPDATE public.invitations 
    SET is_used = true, used_at = now()
    WHERE id = invitation_record.id;
    
    RAISE LOG 'Invitation marked as used for: %', NEW.email;
  ELSE
    RAISE LOG 'No invitation found for: %, creating regular ADMIN profile', NEW.email;
    
    -- Regular signup without invitation - default to ADMIN role
    INSERT INTO public.profiles (
      user_id,
      email,
      first_name,
      last_name,
      company_name,
      role,
      is_active
    ) VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.raw_user_meta_data->>'company_name',
      'ADMIN',
      true
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_invitation_signup: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_invitation_signup();