-- Fix security warnings by setting search_path for functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;