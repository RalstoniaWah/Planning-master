-- Update RLS policy for employee_statuses to allow access to global statuses (user_id is null) and personal statuses
DROP POLICY IF EXISTS "Users can view their own employee statuses" ON public.employee_statuses;

CREATE POLICY "Users can view employee statuses" 
ON public.employee_statuses 
FOR SELECT 
USING (user_id IS NULL OR auth.uid() = user_id);

-- Update other policies to allow global statuses
DROP POLICY IF EXISTS "Users can create their own employee statuses" ON public.employee_statuses;
DROP POLICY IF EXISTS "Users can update their own employee statuses" ON public.employee_statuses;
DROP POLICY IF EXISTS "Users can delete their own employee statuses" ON public.employee_statuses;

CREATE POLICY "Users can create employee statuses" 
ON public.employee_statuses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their employee statuses" 
ON public.employee_statuses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their employee statuses" 
ON public.employee_statuses 
FOR DELETE 
USING (auth.uid() = user_id);