-- Create employee_sites table for many-to-many relationship
CREATE TABLE public.employee_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  site_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(employee_id, site_id)
);

-- Enable Row Level Security
ALTER TABLE public.employee_sites ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_sites
CREATE POLICY "Users can view employee site assignments for their employees" 
ON public.employee_sites 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM employees e 
  WHERE e.id = employee_sites.employee_id 
  AND e.user_id = auth.uid()
));

CREATE POLICY "Users can create employee site assignments for their employees" 
ON public.employee_sites 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM employees e 
  WHERE e.id = employee_sites.employee_id 
  AND e.user_id = auth.uid()
) AND EXISTS (
  SELECT 1 FROM sites s 
  WHERE s.id = employee_sites.site_id 
  AND s.user_id = auth.uid()
));

CREATE POLICY "Users can update employee site assignments for their employees" 
ON public.employee_sites 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM employees e 
  WHERE e.id = employee_sites.employee_id 
  AND e.user_id = auth.uid()
));

CREATE POLICY "Users can delete employee site assignments for their employees" 
ON public.employee_sites 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM employees e 
  WHERE e.id = employee_sites.employee_id 
  AND e.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employee_sites_updated_at
BEFORE UPDATE ON public.employee_sites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create audit trigger
CREATE TRIGGER employee_sites_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.employee_sites
FOR EACH ROW
EXECUTE FUNCTION public.create_enhanced_audit_log();