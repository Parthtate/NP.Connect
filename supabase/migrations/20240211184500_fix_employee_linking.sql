-- Link profiles to employees by matching email
UPDATE profiles
SET employee_id = employees.id
FROM employees
WHERE profiles.email = employees.email
AND profiles.employee_id IS NULL;

-- Verify the links
SELECT 
    p.email, 
    p.full_name as profile_name, 
    p.role, 
    p.employee_id, 
    e.full_name as employee_name 
FROM profiles p
LEFT JOIN employees e ON p.employee_id = e.id
WHERE p.role = 'EMPLOYEE';
