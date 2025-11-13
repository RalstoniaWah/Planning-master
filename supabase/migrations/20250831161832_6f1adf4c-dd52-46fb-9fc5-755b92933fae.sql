-- Create enum for employee experience level
CREATE TYPE public.employee_experience_level AS ENUM ('NOUVEAU', 'VETERANE', 'MANAGER');

-- Create enum for employee relationship types
CREATE TYPE public.employee_relationship_type AS ENUM ('CONFLICT', 'PREFERENCE', 'MENTOR_MENTEE');

-- Create enum for work day preferences
CREATE TYPE public.work_day_preference AS ENUM ('AVAILABLE', 'PREFERRED', 'UNAVAILABLE');

-- Add experience level to employees table
ALTER TABLE public.employees 
ADD COLUMN experience_level public.employee_experience_level DEFAULT 'NOUVEAU',
ADD COLUMN hire_date DATE DEFAULT CURRENT_DATE;

-- Create site opening hours table
CREATE TABLE public.site_opening_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(site_id, day_of_week)
);

-- Create employee relationships table
CREATE TABLE public.employee_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_1_id UUID NOT NULL,
  employee_2_id UUID NOT NULL,
  relationship_type public.employee_relationship_type NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_1_id, employee_2_id, relationship_type),
  CHECK (employee_1_id != employee_2_id)
);

-- Create employee work preferences table
CREATE TABLE public.employee_work_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  preference public.work_day_preference NOT NULL DEFAULT 'AVAILABLE',
  preferred_start_time TIME,
  preferred_end_time TIME,
  max_hours_per_day INTEGER DEFAULT 8,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, day_of_week)
);

-- Create schedule generation requests table
CREATE TABLE public.schedule_generation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'PENDING',
  generated_by UUID NOT NULL,
  generation_parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.site_opening_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_work_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_generation_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for site_opening_hours
CREATE POLICY "Users can view opening hours for their sites"
ON public.site_opening_hours FOR SELECT
USING (EXISTS (
  SELECT 1 FROM sites s 
  WHERE s.id = site_opening_hours.site_id 
  AND s.user_id = auth.uid()
));

CREATE POLICY "Users can manage opening hours for their sites"
ON public.site_opening_hours FOR ALL
USING (EXISTS (
  SELECT 1 FROM sites s 
  WHERE s.id = site_opening_hours.site_id 
  AND s.user_id = auth.uid()
));

-- RLS Policies for employee_relationships
CREATE POLICY "Users can view relationships for their employees"
ON public.employee_relationships FOR SELECT
USING (EXISTS (
  SELECT 1 FROM employees e1, employees e2
  WHERE (e1.id = employee_relationships.employee_1_id OR e1.id = employee_relationships.employee_2_id)
  AND (e2.id = employee_relationships.employee_1_id OR e2.id = employee_relationships.employee_2_id)
  AND e1.user_id = auth.uid() AND e2.user_id = auth.uid()
));

CREATE POLICY "Users can manage relationships for their employees"
ON public.employee_relationships FOR ALL
USING (EXISTS (
  SELECT 1 FROM employees e1, employees e2
  WHERE (e1.id = employee_relationships.employee_1_id OR e1.id = employee_relationships.employee_2_id)
  AND (e2.id = employee_relationships.employee_1_id OR e2.id = employee_relationships.employee_2_id)
  AND e1.user_id = auth.uid() AND e2.user_id = auth.uid()
));

-- RLS Policies for employee_work_preferences
CREATE POLICY "Users can view work preferences for their employees"
ON public.employee_work_preferences FOR SELECT
USING (EXISTS (
  SELECT 1 FROM employees e 
  WHERE e.id = employee_work_preferences.employee_id 
  AND e.user_id = auth.uid()
));

CREATE POLICY "Users can manage work preferences for their employees"
ON public.employee_work_preferences FOR ALL
USING (EXISTS (
  SELECT 1 FROM employees e 
  WHERE e.id = employee_work_preferences.employee_id 
  AND e.user_id = auth.uid()
));

-- RLS Policies for schedule_generation_requests
CREATE POLICY "Users can view their schedule generation requests"
ON public.schedule_generation_requests FOR SELECT
USING (generated_by = auth.uid());

CREATE POLICY "Users can create schedule generation requests"
ON public.schedule_generation_requests FOR INSERT
WITH CHECK (generated_by = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_site_opening_hours_updated_at
BEFORE UPDATE ON public.site_opening_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_relationships_updated_at
BEFORE UPDATE ON public.employee_relationships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_work_preferences_updated_at
BEFORE UPDATE ON public.employee_work_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_generation_requests_updated_at
BEFORE UPDATE ON public.schedule_generation_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit triggers
CREATE TRIGGER site_opening_hours_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.site_opening_hours
FOR EACH ROW
EXECUTE FUNCTION public.create_enhanced_audit_log();

CREATE TRIGGER employee_relationships_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.employee_relationships
FOR EACH ROW
EXECUTE FUNCTION public.create_enhanced_audit_log();

CREATE TRIGGER employee_work_preferences_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.employee_work_preferences
FOR EACH ROW
EXECUTE FUNCTION public.create_enhanced_audit_log();