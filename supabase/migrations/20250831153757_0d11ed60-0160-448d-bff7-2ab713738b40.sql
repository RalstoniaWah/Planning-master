-- Create invitations table for better management
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company_name TEXT,
  role public.user_role NOT NULL,
  employee_data JSONB, -- For employee-specific data like status, hourly rate, etc.
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitation_token TEXT NOT NULL UNIQUE,
  invitation_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for invitations
CREATE POLICY "Users can view their own invitations" ON public.invitations
  FOR SELECT USING (invited_by = auth.uid());

CREATE POLICY "Users can create invitations" ON public.invitations
  FOR INSERT WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Users can update their own invitations" ON public.invitations
  FOR UPDATE USING (invited_by = auth.uid());

-- Function to handle invitation signup
CREATE OR REPLACE FUNCTION public.handle_invitation_signup()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if this user was invited
  SELECT * INTO invitation_record 
  FROM public.invitations 
  WHERE email = NEW.email 
    AND is_used = false 
    AND invitation_expires_at > now()
  LIMIT 1;

  IF invitation_record IS NOT NULL THEN
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
        (SELECT user_id FROM public.profiles WHERE user_id = invitation_record.invited_by LIMIT 1), -- Company owner
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for invitation handling
CREATE TRIGGER on_auth_user_created_invitation
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_invitation_signup();

-- Add updated_at trigger for invitations
CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();