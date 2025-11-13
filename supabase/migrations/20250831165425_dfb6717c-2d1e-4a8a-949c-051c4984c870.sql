-- Insert default employee statuses
INSERT INTO public.employee_statuses (code, label, hours_limits, is_student, color, user_id) VALUES
('FULL_TIME', 'Temps plein', '{"weekly": 40, "monthly": 173, "yearly": 2080}', false, '#10B981', null),
('PART_TIME', 'Temps partiel', '{"weekly": 20, "monthly": 87, "yearly": 1040}', false, '#3B82F6', null),
('STUDENT', 'Étudiant', '{"weekly": 15, "monthly": 65, "yearly": 780}', true, '#8B5CF6', null),
('INTERN', 'Stagiaire', '{"weekly": 35, "monthly": 152, "yearly": 1820}', true, '#F59E0B', null),
('SEASONAL', 'Saisonnier', '{"weekly": 40, "monthly": 173, "yearly": 1040}', false, '#EF4444', null);