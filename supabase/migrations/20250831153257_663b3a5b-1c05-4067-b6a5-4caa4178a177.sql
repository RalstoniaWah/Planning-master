-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'SUPER_MANAGER', 'EMPLOYEE');

-- Create availability types enum
CREATE TYPE public.availability_type AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'PREFERRED');

-- Create leave types enum (extended)
CREATE TYPE public.extended_leave_type AS ENUM ('VACATION', 'SICK', 'MATERNITY', 'PATERNITY', 'PERSONAL', 'EXAM_PERIOD');

-- Add role to profiles table
ALTER TABLE public.profiles ADD COLUMN role public.user_role DEFAULT 'ADMIN';
ALTER TABLE public.profiles ADD COLUMN invited_by UUID REFERENCES public.profiles(user_id);
ALTER TABLE public.profiles ADD COLUMN invitation_token TEXT;
ALTER TABLE public.profiles ADD COLUMN invitation_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create storage bucket for medical certificates
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-certificates', 'medical-certificates', false);

-- Create employee availabilities table
CREATE TABLE public.employee_availabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  availability_type public.availability_type DEFAULT 'AVAILABLE',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Create employee sick leaves table (extended from regular leaves)
CREATE TABLE public.employee_sick_leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  medical_certificate_url TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam periods table for students
CREATE TABLE public.exam_periods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.employee_availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_sick_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_periods ENABLE ROW LEVEL SECURITY;

-- Enhanced audit logs with user context
ALTER TABLE public.audit_logs ADD COLUMN user_email TEXT;
ALTER TABLE public.audit_logs ADD COLUMN user_role public.user_role;
ALTER TABLE public.audit_logs ADD COLUMN action_description TEXT;

-- Update audit function to include user context
CREATE OR REPLACE FUNCTION public.create_enhanced_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  current_user_role public.user_role;
  action_desc TEXT;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  
  IF current_user_id IS NOT NULL THEN
    SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    SELECT role INTO current_user_role FROM public.profiles WHERE user_id = current_user_id;
    
    -- Create action description
    IF TG_OP = 'INSERT' THEN
      action_desc := 'Created ' || TG_TABLE_NAME || ' record';
    ELSIF TG_OP = 'UPDATE' THEN
      action_desc := 'Updated ' || TG_TABLE_NAME || ' record';
    ELSIF TG_OP = 'DELETE' THEN
      action_desc := 'Deleted ' || TG_TABLE_NAME || ' record';
    END IF;
    
    -- Insert audit log
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.audit_logs (
        user_id, user_email, user_role, table_name, action, record_id, 
        new_data, action_description
      ) VALUES (
        current_user_id, current_user_email, current_user_role, 
        TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW), action_desc
      );
      RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO public.audit_logs (
        user_id, user_email, user_role, table_name, action, record_id, 
        old_data, new_data, action_description
      ) VALUES (
        current_user_id, current_user_email, current_user_role, 
        TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW), action_desc
      );
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO public.audit_logs (
        user_id, user_email, user_role, table_name, action, record_id, 
        old_data, action_description
      ) VALUES (
        current_user_id, current_user_email, current_user_role, 
        TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD), action_desc
      );
      RETURN OLD;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create RLS policies for employee availabilities
CREATE POLICY "Users can view availabilities for their employees" ON public.employee_availabilities
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_availabilities.employee_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "Employees can view their own availabilities" ON public.employee_availabilities
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_availabilities.employee_id AND e.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ));

CREATE POLICY "Employees can manage their own availabilities" ON public.employee_availabilities
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_availabilities.employee_id AND e.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ));

-- Create RLS policies for sick leaves
CREATE POLICY "Users can view sick leaves for their employees" ON public.employee_sick_leaves
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_sick_leaves.employee_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "Employees can view their own sick leaves" ON public.employee_sick_leaves
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_sick_leaves.employee_id AND e.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ));

CREATE POLICY "Employees can create their own sick leaves" ON public.employee_sick_leaves
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = employee_sick_leaves.employee_id AND e.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ));

-- Create RLS policies for exam periods
CREATE POLICY "Users can view exam periods for their employees" ON public.exam_periods
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.employees e 
    WHERE e.id = exam_periods.employee_id AND e.user_id = auth.uid()
  ));

CREATE POLICY "Students can manage their own exam periods" ON public.exam_periods
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.employees e, public.employee_statuses es
    WHERE e.id = exam_periods.employee_id 
    AND e.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND e.status_id = es.id AND es.is_student = true
  ));

-- Storage policies for medical certificates
CREATE POLICY "Employees can upload their own medical certificates" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'medical-certificates' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view medical certificates for their employees" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'medical-certificates'
    AND (
      -- Owner can see all
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Managers can see their employees' certificates
      EXISTS (
        SELECT 1 FROM public.employees e
        WHERE e.user_id = auth.uid()
        AND e.email || '/' = (storage.foldername(name))[1] || '/'
      )
    )
  );

-- Create triggers for enhanced audit logging
DROP TRIGGER IF EXISTS audit_sites_trigger ON public.sites;
DROP TRIGGER IF EXISTS audit_employees_trigger ON public.employees;
DROP TRIGGER IF EXISTS audit_employee_statuses_trigger ON public.employee_statuses;

CREATE TRIGGER audit_sites_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.create_enhanced_audit_log();

CREATE TRIGGER audit_employees_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.create_enhanced_audit_log();

CREATE TRIGGER audit_employee_statuses_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_statuses
  FOR EACH ROW EXECUTE FUNCTION public.create_enhanced_audit_log();

CREATE TRIGGER audit_availabilities_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_availabilities
  FOR EACH ROW EXECUTE FUNCTION public.create_enhanced_audit_log();

CREATE TRIGGER audit_sick_leaves_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_sick_leaves
  FOR EACH ROW EXECUTE FUNCTION public.create_enhanced_audit_log();

CREATE TRIGGER audit_exam_periods_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.exam_periods
  FOR EACH ROW EXECUTE FUNCTION public.create_enhanced_audit_log();

-- Add updated_at triggers for new tables
CREATE TRIGGER update_employee_availabilities_updated_at
  BEFORE UPDATE ON public.employee_availabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_sick_leaves_updated_at
  BEFORE UPDATE ON public.employee_sick_leaves
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_periods_updated_at
  BEFORE UPDATE ON public.exam_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;