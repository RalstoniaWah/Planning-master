-- Corriger le système de rôles étape par étape

-- 1. Sauvegarder les rôles existants
CREATE TEMP TABLE temp_profile_roles AS 
SELECT user_id, role FROM public.profiles;

-- 2. Supprimer temporairement la contrainte de la colonne role
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;

-- 3. Supprimer et recréer l'enum avec tous les rôles
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'SUPER_MANAGER', 'ADMIN', 'MANAGER', 'EMPLOYEE');

-- 4. Convertir la colonne role au nouveau type
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE user_role USING 
  CASE 
    WHEN role::text = 'ADMIN' THEN 'ADMIN'::user_role
    WHEN role::text = 'MANAGER' THEN 'MANAGER'::user_role 
    WHEN role::text = 'EMPLOYEE' THEN 'EMPLOYEE'::user_role
    ELSE 'ADMIN'::user_role
  END;

-- 5. Remettre la valeur par défaut
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'ADMIN'::user_role;

-- 6. Mise à jour de la fonction handle_invitation_signup
CREATE OR REPLACE FUNCTION public.handle_invitation_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  invitation_record RECORD;
  company_user_id UUID;
BEGIN
  -- Check if this user was invited
  SELECT * INTO invitation_record 
  FROM public.invitations 
  WHERE email = NEW.email 
    AND is_used = false 
    AND invitation_expires_at > now()
  LIMIT 1;

  IF invitation_record IS NOT NULL THEN
    -- Get the company owner's user_id
    SELECT user_id INTO company_user_id 
    FROM public.profiles 
    WHERE user_id = invitation_record.invited_by;

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
        company_user_id, -- Use the company owner's ID
        COALESCE((invitation_record.employee_data->>'employee_number'), 'EMP' || extract(epoch from now())::text),
        invitation_record.first_name,
        invitation_record.last_name,
        invitation_record.email,
        invitation_record.employee_data->>'phone',
        (invitation_record.employee_data->>'birth_date')::date,
        (invitation_record.employee_data->>'status_id')::uuid,
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
  ELSE
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
END;
$function$;

-- 7. Fonction pour obtenir le rôle de l'utilisateur actuel (SECURITY DEFINER pour éviter la récursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- 8. Fonction pour vérifier les permissions basées sur la hiérarchie
CREATE OR REPLACE FUNCTION public.can_access_data(target_user_id UUID, required_level user_role DEFAULT 'EMPLOYEE')
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH user_role_level AS (
    SELECT 
      CASE 
        WHEN get_current_user_role() = 'SUPER_ADMIN' THEN 5
        WHEN get_current_user_role() = 'SUPER_MANAGER' THEN 4
        WHEN get_current_user_role() = 'ADMIN' THEN 3
        WHEN get_current_user_role() = 'MANAGER' THEN 2
        WHEN get_current_user_role() = 'EMPLOYEE' THEN 1
        ELSE 0
      END as level
  ),
  required_role_level AS (
    SELECT 
      CASE 
        WHEN required_level = 'SUPER_ADMIN' THEN 5
        WHEN required_level = 'SUPER_MANAGER' THEN 4
        WHEN required_level = 'ADMIN' THEN 3
        WHEN required_level = 'MANAGER' THEN 2
        WHEN required_level = 'EMPLOYEE' THEN 1
        ELSE 0
      END as level
  )
  SELECT 
    COALESCE((
      SELECT u.level >= r.level 
      FROM user_role_level u, required_role_level r
    ), false)
    OR auth.uid() = target_user_id;
$$;