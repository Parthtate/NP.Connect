-- Up Migration
ALTER TABLE employees 
ALTER COLUMN leave_balance_current_month TYPE numeric(5,2);

-- Also ensure 'leaves' table has 'days_count' as numeric/float just in case
ALTER TABLE leaves 
ALTER COLUMN days_count TYPE numeric(3,1);
