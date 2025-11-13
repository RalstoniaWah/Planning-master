-- Ajouter une colonne archived et archived_at pour l'archivage des employés
ALTER TABLE public.employees 
ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN archived_by UUID NULL REFERENCES auth.users(id);

-- Créer un index sur la colonne archived pour améliorer les performances
CREATE INDEX idx_employees_archived ON public.employees(archived);

-- Créer une politique RLS pour les employés archivés
CREATE POLICY "Users can view archived employees for their company" 
ON public.employees 
FOR SELECT 
USING (auth.uid() = user_id);

-- Fonction pour archiver un employé
CREATE OR REPLACE FUNCTION public.archive_employee(employee_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.employees 
  SET archived = true, 
      archived_at = now(), 
      archived_by = auth.uid(),
      active = false
  WHERE id = employee_id 
    AND user_id = auth.uid();
$$;

-- Fonction pour restaurer un employé
CREATE OR REPLACE FUNCTION public.restore_employee(employee_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.employees 
  SET archived = false, 
      archived_at = null, 
      archived_by = null,
      active = true
  WHERE id = employee_id 
    AND user_id = auth.uid();
$$;