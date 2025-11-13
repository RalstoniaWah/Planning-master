-- Supprimer toutes les données liées aux employés de test
-- D'abord, supprimer les données dépendantes dans l'ordre correct

-- Supprimer les assignments
DELETE FROM public.assignments 
WHERE employee_id IN (
  SELECT id FROM public.employees 
  WHERE email LIKE '%@example.com'
);

-- Supprimer les disponibilités
DELETE FROM public.employee_availabilities 
WHERE employee_id IN (
  SELECT id FROM public.employees 
  WHERE email LIKE '%@example.com'
);

-- Supprimer les congés
DELETE FROM public.employee_leaves 
WHERE employee_id IN (
  SELECT id FROM public.employees 
  WHERE email LIKE '%@example.com'
);

-- Supprimer les congés maladie
DELETE FROM public.employee_sick_leaves 
WHERE employee_id IN (
  SELECT id FROM public.employees 
  WHERE email LIKE '%@example.com'
);

-- Supprimer les périodes d'examens
DELETE FROM public.exam_periods 
WHERE employee_id IN (
  SELECT id FROM public.employees 
  WHERE email LIKE '%@example.com'
);

-- Supprimer les assignations de sites
DELETE FROM public.employee_sites 
WHERE employee_id IN (
  SELECT id FROM public.employees 
  WHERE email LIKE '%@example.com'
);

-- Supprimer les préférences de travail
DELETE FROM public.employee_work_preferences 
WHERE employee_id IN (
  SELECT id FROM public.employees 
  WHERE email LIKE '%@example.com'
);

-- Supprimer les relations entre employés
DELETE FROM public.employee_relationships 
WHERE employee_1_id IN (
  SELECT id FROM public.employees 
  WHERE email LIKE '%@example.com'
) OR employee_2_id IN (
  SELECT id FROM public.employees 
  WHERE email LIKE '%@example.com'
);

-- Enfin, supprimer les employés eux-mêmes
DELETE FROM public.employees 
WHERE email LIKE '%@example.com';