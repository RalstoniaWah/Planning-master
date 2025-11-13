-- Corriger les fonctions pour ajouter le search_path sécurisé
CREATE OR REPLACE FUNCTION public.archive_employee(employee_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
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
SET search_path = public
AS $$
  UPDATE public.employees 
  SET archived = false, 
      archived_at = null, 
      archived_by = null,
      active = true
  WHERE id = employee_id 
    AND user_id = auth.uid();
$$;