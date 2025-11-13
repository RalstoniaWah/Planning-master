-- Clear all existing data
DELETE FROM assignments;
DELETE FROM employee_leaves;
DELETE FROM shifts;
DELETE FROM employees;
DELETE FROM employee_statuses;
DELETE FROM sites;

-- Add user_id columns to tables for multi-tenant support
ALTER TABLE sites ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE employees ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE employee_statuses ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update RLS policies to be user-based
-- Sites policies
DROP POLICY IF EXISTS "Allow read access to sites" ON sites;
DROP POLICY IF EXISTS "Allow insert to sites" ON sites;
DROP POLICY IF EXISTS "Allow update to sites" ON sites;

CREATE POLICY "Users can view their own sites" ON sites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sites" ON sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sites" ON sites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites" ON sites
  FOR DELETE USING (auth.uid() = user_id);

-- Employees policies
DROP POLICY IF EXISTS "Allow read access to employees" ON employees;
DROP POLICY IF EXISTS "Allow insert to employees" ON employees;
DROP POLICY IF EXISTS "Allow update to employees" ON employees;

CREATE POLICY "Users can view their own employees" ON employees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own employees" ON employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees" ON employees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees" ON employees
  FOR DELETE USING (auth.uid() = user_id);

-- Employee statuses policies
DROP POLICY IF EXISTS "Allow read access to employee_statuses" ON employee_statuses;
DROP POLICY IF EXISTS "Allow insert to employee_statuses" ON employee_statuses;
DROP POLICY IF EXISTS "Allow update to employee_statuses" ON employee_statuses;

CREATE POLICY "Users can view their own employee statuses" ON employee_statuses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own employee statuses" ON employee_statuses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employee statuses" ON employee_statuses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employee statuses" ON employee_statuses
  FOR DELETE USING (auth.uid() = user_id);

-- Shifts policies (join with sites to check ownership)
DROP POLICY IF EXISTS "Allow read access to shifts" ON shifts;
DROP POLICY IF EXISTS "Allow insert to shifts" ON shifts;
DROP POLICY IF EXISTS "Allow update to shifts" ON shifts;

CREATE POLICY "Users can view shifts for their sites" ON shifts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM sites WHERE sites.id = shifts.site_id AND sites.user_id = auth.uid()
  ));

CREATE POLICY "Users can create shifts for their sites" ON shifts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM sites WHERE sites.id = shifts.site_id AND sites.user_id = auth.uid()
  ));

CREATE POLICY "Users can update shifts for their sites" ON shifts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM sites WHERE sites.id = shifts.site_id AND sites.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete shifts for their sites" ON shifts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM sites WHERE sites.id = shifts.site_id AND sites.user_id = auth.uid()
  ));

-- Assignments policies (join with employees to check ownership)
DROP POLICY IF EXISTS "Allow read access to assignments" ON assignments;
DROP POLICY IF EXISTS "Allow insert to assignments" ON assignments;
DROP POLICY IF EXISTS "Allow update to assignments" ON assignments;

CREATE POLICY "Users can view assignments for their employees" ON assignments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = assignments.employee_id AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Users can create assignments for their employees" ON assignments
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = assignments.employee_id AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Users can update assignments for their employees" ON assignments
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = assignments.employee_id AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete assignments for their employees" ON assignments
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = assignments.employee_id AND employees.user_id = auth.uid()
  ));

-- Employee leaves policies
DROP POLICY IF EXISTS "Allow read access to employee_leaves" ON employee_leaves;
DROP POLICY IF EXISTS "Allow insert to employee_leaves" ON employee_leaves;
DROP POLICY IF EXISTS "Allow update to employee_leaves" ON employee_leaves;

CREATE POLICY "Users can view leaves for their employees" ON employee_leaves
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = employee_leaves.employee_id AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Users can create leaves for their employees" ON employee_leaves
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = employee_leaves.employee_id AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Users can update leaves for their employees" ON employee_leaves
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = employee_leaves.employee_id AND employees.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete leaves for their employees" ON employee_leaves
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM employees WHERE employees.id = employee_leaves.employee_id AND employees.user_id = auth.uid()
  ));

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit log table for data backup
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  table_name TEXT NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, table_name, action, record_id, new_data)
    VALUES (NEW.user_id, TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, table_name, action, record_id, old_data, new_data)
    VALUES (NEW.user_id, TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (user_id, table_name, action, record_id, old_data)
    VALUES (OLD.user_id, TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for all tables
CREATE TRIGGER audit_sites_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.sites
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER audit_employees_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

CREATE TRIGGER audit_employee_statuses_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_statuses
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

-- For tables without direct user_id, we need special handling
CREATE OR REPLACE FUNCTION public.create_audit_log_with_user_lookup()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user_id based on the table
  IF TG_TABLE_NAME = 'shifts' THEN
    SELECT s.user_id INTO target_user_id FROM sites s WHERE s.id = COALESCE(NEW.site_id, OLD.site_id);
  ELSIF TG_TABLE_NAME = 'assignments' THEN
    SELECT e.user_id INTO target_user_id FROM employees e WHERE e.id = COALESCE(NEW.employee_id, OLD.employee_id);
  ELSIF TG_TABLE_NAME = 'employee_leaves' THEN
    SELECT e.user_id INTO target_user_id FROM employees e WHERE e.id = COALESCE(NEW.employee_id, OLD.employee_id);
  END IF;

  IF target_user_id IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      INSERT INTO public.audit_logs (user_id, table_name, action, record_id, new_data)
      VALUES (target_user_id, TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(NEW));
      RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
      INSERT INTO public.audit_logs (user_id, table_name, action, record_id, old_data, new_data)
      VALUES (target_user_id, TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW));
      RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
      INSERT INTO public.audit_logs (user_id, table_name, action, record_id, old_data)
      VALUES (target_user_id, TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD));
      RETURN OLD;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_shifts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log_with_user_lookup();

CREATE TRIGGER audit_assignments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log_with_user_lookup();

CREATE TRIGGER audit_employee_leaves_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_leaves
  FOR EACH ROW EXECUTE FUNCTION public.create_audit_log_with_user_lookup();