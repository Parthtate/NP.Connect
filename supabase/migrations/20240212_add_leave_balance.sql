-- Migration: Add leave balance tracking and payroll integration
-- File: supabase/migrations/20240212_add_leave_balance.sql
-- Description: Implements leave balance system (2 paid/month with carryforward) and unpaid leave payroll deductions

-- =====================================================
-- 1. ADD LEAVE BALANCE TRACKING TO EMPLOYEES
-- =====================================================
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS leave_balance_current_month INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS leave_balance_month TEXT DEFAULT NULL;

COMMENT ON COLUMN employees.leave_balance_current_month IS 'Cumulative paid leaves balance (2 added monthly, unused carry forward)';
COMMENT ON COLUMN employees.leave_balance_month IS 'Month (YYYY-MM) when balance was last updated';

-- =====================================================
-- 2. ADD PAID/UNPAID TRACKING TO LEAVES
-- =====================================================
ALTER TABLE leaves
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS days_count DECIMAL DEFAULT 1.0;

COMMENT ON COLUMN leaves.is_paid IS 'Whether this leave was paid (had sufficient balance) or unpaid';
COMMENT ON COLUMN leaves.days_count IS 'Number of days for this leave (0.5 for half-day, 1.0 for full-day)';

-- Note: No need to track unpaid_leave_days in payroll table
-- Attendance status already represents total daily credit (work + leave combined)
-- Payroll simply uses attendance effective days for calculation

-- =====================================================
-- 4. INITIALIZE EXISTING EMPLOYEES WITH CURRENT MONTH BALANCE
-- =====================================================
UPDATE employees
SET leave_balance_current_month = 2,
    leave_balance_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
WHERE leave_balance_month IS NULL;

-- =====================================================
-- 5. UPDATE EXISTING LEAVES WITH DAYS COUNT
-- =====================================================
UPDATE leaves
SET days_count = CASE 
    WHEN session = 'FULL_DAY' THEN 1.0
    WHEN session IN ('FIRST_HALF', 'SECOND_HALF') THEN 0.5
    ELSE 1.0
END
WHERE days_count IS NULL;

-- =====================================================
-- 6. MARK ALL EXISTING APPROVED LEAVES AS PAID (GRANDFATHER)
-- =====================================================
UPDATE leaves
SET is_paid = TRUE
WHERE status = 'Approved' AND is_paid IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify migration success:

-- Check employees have been initialized
SELECT 
    id,
    full_name,
    leave_balance_current_month,
    leave_balance_month
FROM employees
LIMIT 5;

-- Check leaves have days_count and is_paid
SELECT 
    id,
    employee_id,
    type,
    session,
    days_count,
    is_paid,
    status
FROM leaves
ORDER BY requested_on DESC
LIMIT 10;

-- Check payroll table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'payroll'
AND column_name IN ('unpaid_leave_days');
