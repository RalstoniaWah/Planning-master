-- Clean up all test data except super admin
-- First, get the super admin user ID (if exists)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find super admin user (assuming it's the first admin created or has specific email)
    SELECT user_id INTO admin_user_id 
    FROM public.profiles 
    WHERE role = 'ADMIN' 
    ORDER BY created_at ASC 
    LIMIT 1;

    -- Delete all assignments
    DELETE FROM public.assignments;
    
    -- Delete all shifts
    DELETE FROM public.shifts;
    
    -- Delete all employee data except those belonging to super admin
    DELETE FROM public.employee_leaves WHERE employee_id IN (
        SELECT id FROM public.employees WHERE user_id != admin_user_id OR user_id IS NULL
    );
    
    DELETE FROM public.employee_availabilities WHERE employee_id IN (
        SELECT id FROM public.employees WHERE user_id != admin_user_id OR user_id IS NULL
    );
    
    DELETE FROM public.employee_relationships WHERE employee_1_id IN (
        SELECT id FROM public.employees WHERE user_id != admin_user_id OR user_id IS NULL
    ) OR employee_2_id IN (
        SELECT id FROM public.employees WHERE user_id != admin_user_id OR user_id IS NULL
    );
    
    DELETE FROM public.employee_sites WHERE employee_id IN (
        SELECT id FROM public.employees WHERE user_id != admin_user_id OR user_id IS NULL
    );
    
    DELETE FROM public.employee_work_preferences WHERE employee_id IN (
        SELECT id FROM public.employees WHERE user_id != admin_user_id OR user_id IS NULL
    );
    
    DELETE FROM public.employee_sick_leaves WHERE employee_id IN (
        SELECT id FROM public.employees WHERE user_id != admin_user_id OR user_id IS NULL
    );
    
    DELETE FROM public.exam_periods WHERE employee_id IN (
        SELECT id FROM public.employees WHERE user_id != admin_user_id OR user_id IS NULL
    );
    
    -- Delete employees except those belonging to super admin
    DELETE FROM public.employees WHERE user_id != admin_user_id OR user_id IS NULL;
    
    -- Delete sites except those belonging to super admin
    DELETE FROM public.sites WHERE user_id != admin_user_id OR user_id IS NULL;
    
    -- Delete site opening hours for deleted sites
    DELETE FROM public.site_opening_hours WHERE site_id NOT IN (SELECT id FROM public.sites);
    
    -- Delete employee statuses except system defaults and super admin's
    DELETE FROM public.employee_statuses WHERE user_id IS NOT NULL AND user_id != admin_user_id;
    
    -- Delete schedule generation requests except super admin's
    DELETE FROM public.schedule_generation_requests WHERE generated_by != admin_user_id;
    
    -- Delete invitations except super admin's
    DELETE FROM public.invitations WHERE invited_by != admin_user_id;
    
    -- Delete profiles except super admin
    DELETE FROM public.profiles WHERE user_id != admin_user_id;

END $$;