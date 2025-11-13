-- Create table for employee leave/vacation management
CREATE TABLE public.employee_leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  leave_type TEXT NOT NULL DEFAULT 'VACATION',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add leave entitlements to employees table
ALTER TABLE public.employees 
ADD COLUMN annual_leave_days INTEGER NOT NULL DEFAULT 25,
ADD COLUMN sick_leave_days INTEGER NOT NULL DEFAULT 10,
ADD COLUMN current_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);

-- Enable Row Level Security
ALTER TABLE public.employee_leaves ENABLE ROW LEVEL SECURITY;

-- Create policies for employee_leaves
CREATE POLICY "Allow read access to employee_leaves" 
ON public.employee_leaves 
FOR SELECT 
USING (true);

CREATE POLICY "Allow insert to employee_leaves" 
ON public.employee_leaves 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow update to employee_leaves" 
ON public.employee_leaves 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_employee_leaves_updated_at
BEFORE UPDATE ON public.employee_leaves
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_employee_leaves_employee_id ON public.employee_leaves(employee_id);
CREATE INDEX idx_employee_leaves_dates ON public.employee_leaves(start_date, end_date);
CREATE INDEX idx_employee_leaves_status ON public.employee_leaves(status);

-- Insert some demo leave data
INSERT INTO public.employee_leaves (employee_id, leave_type, start_date, end_date, days_count, status, reason) 
SELECT 
  e.id,
  'VACATION',
  CURRENT_DATE + INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '37 days',
  7,
  'APPROVED',
  'Vacances d''été'
FROM public.employees e
WHERE e.contract_type = 'CDI'
LIMIT 2;

INSERT INTO public.employee_leaves (employee_id, leave_type, start_date, end_date, days_count, status, reason) 
SELECT 
  e.id,
  'SICK',
  CURRENT_DATE - INTERVAL '5 days',
  CURRENT_DATE - INTERVAL '3 days',
  3,
  'APPROVED',
  'Maladie'
FROM public.employees e
WHERE e.contract_type = 'CDI'
LIMIT 1;