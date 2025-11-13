-- Supprimer toutes les données des tables (en respectant l'ordre des contraintes de clés étrangères)

-- Tables dépendantes d'abord
DELETE FROM public.assignments;
DELETE FROM public.employee_availabilities;
DELETE FROM public.employee_leaves;
DELETE FROM public.employee_sick_leaves;
DELETE FROM public.employee_relationships;
DELETE FROM public.employee_sites;
DELETE FROM public.employee_work_preferences;
DELETE FROM public.exam_periods;
DELETE FROM public.site_opening_hours;
DELETE FROM public.schedule_generation_requests;

-- Tables principales
DELETE FROM public.shifts;
DELETE FROM public.employees;
DELETE FROM public.sites;
DELETE FROM public.employee_statuses;

-- Tables système
DELETE FROM public.audit_logs;
DELETE FROM public.invitations;
DELETE FROM public.profiles;

-- Redémarrer les séquences si nécessaire (optionnel)
-- Cette commande réinitialise les compteurs auto-incrémentés
-- Pas nécessaire pour les UUIDs mais bon à avoir pour la cohérence