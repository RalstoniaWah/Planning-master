-- Clean up all mock data and test entries

-- Delete shifts first (has foreign key to sites)
DELETE FROM shifts;

-- Delete invitations 
DELETE FROM invitations;

-- Delete mock sites
DELETE FROM sites WHERE name LIKE '%Centre Commercial%' OR name LIKE '%Magasin Centre-Ville%';

-- Delete employee statuses created for testing (keep if user wants to recreate them manually)
DELETE FROM employee_statuses WHERE code IN ('STUDENT', 'CDI', 'INTERN');

-- Clean up audit logs from test data
DELETE FROM audit_logs;

-- Reset any schedule generation requests
DELETE FROM schedule_generation_requests;