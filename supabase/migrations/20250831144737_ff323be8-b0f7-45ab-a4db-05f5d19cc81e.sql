-- Create employee_statuses table
CREATE TABLE public.employee_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  hours_limits JSONB NOT NULL DEFAULT '{"weekly": 40, "monthly": 160, "yearly": 1920}',
  is_student BOOLEAN NOT NULL DEFAULT false,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sites table
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  contact_info JSONB NOT NULL DEFAULT '{}',
  opening_hours JSONB NOT NULL DEFAULT '{}',
  manager_id UUID,
  capacity INTEGER NOT NULL DEFAULT 10,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE NOT NULL,
  status_id UUID NOT NULL REFERENCES public.employee_statuses(id),
  contract_type TEXT NOT NULL CHECK (contract_type IN ('CDI', 'CDD', 'STUDENT', 'INTERN', 'FREELANCE')),
  hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  weekly_hours INTEGER NOT NULL DEFAULT 40,
  photo_url TEXT,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  active BOOLEAN NOT NULL DEFAULT true,
  language TEXT NOT NULL DEFAULT 'FR' CHECK (language IN ('FR', 'NL', 'EN')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shifts table
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  requirements JSONB NOT NULL DEFAULT '{"minEmployees": 1, "maxEmployees": 5}',
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'COMPLETED')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shift_id UUID NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'CONFIRMED', 'DECLINED')),
  role TEXT,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shift_id, employee_id)
);

-- Enable RLS on all tables
ALTER TABLE public.employee_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing read access for now, will be refined later with authentication)
CREATE POLICY "Allow read access to employee_statuses" ON public.employee_statuses FOR SELECT USING (true);
CREATE POLICY "Allow read access to sites" ON public.sites FOR SELECT USING (true);
CREATE POLICY "Allow read access to employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow read access to shifts" ON public.shifts FOR SELECT USING (true);
CREATE POLICY "Allow read access to assignments" ON public.assignments FOR SELECT USING (true);

-- Create policies for insert/update/delete (basic for now)
CREATE POLICY "Allow insert to employee_statuses" ON public.employee_statuses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to sites" ON public.sites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to shifts" ON public.shifts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert to assignments" ON public.assignments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update to employee_statuses" ON public.employee_statuses FOR UPDATE USING (true);
CREATE POLICY "Allow update to sites" ON public.sites FOR UPDATE USING (true);
CREATE POLICY "Allow update to employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Allow update to shifts" ON public.shifts FOR UPDATE USING (true);
CREATE POLICY "Allow update to assignments" ON public.assignments FOR UPDATE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_employee_statuses_updated_at
  BEFORE UPDATE ON public.employee_statuses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sites_updated_at
  BEFORE UPDATE ON public.sites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some demo data
INSERT INTO public.employee_statuses (code, label, hours_limits, is_student, color) VALUES
('FULL_TIME', 'Temps plein', '{"weekly": 40, "monthly": 160, "yearly": 1920}', false, '#10B981'),
('PART_TIME', 'Temps partiel', '{"weekly": 20, "monthly": 80, "yearly": 960}', false, '#F59E0B'),
('STUDENT', 'Étudiant', '{"weekly": 20, "monthly": 80, "yearly": 480}', true, '#8B5CF6'),
('INTERN', 'Stagiaire', '{"weekly": 35, "monthly": 140, "yearly": 840}', false, '#06B6D4');

INSERT INTO public.sites (code, name, address, contact_info, opening_hours, capacity) VALUES
('SITE_A', 'Site Principal', '123 Rue de la Paix, Paris', '{"phone": "+33123456789", "email": "contact@site-a.com"}', '{"monday": {"start": "08:00", "end": "18:00"}, "tuesday": {"start": "08:00", "end": "18:00"}}', 15),
('SITE_B', 'Site Secondaire', '456 Avenue des Champs, Lyon', '{"phone": "+33987654321", "email": "contact@site-b.com"}', '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}}', 10);