-- Migration: Add Database Constraints and Triggers for Root Fixes
-- Date: 2026-02-09
-- Purpose: Replace code patches with proper database-level solutions

-- ============================================================================
-- 1. Add Foreign Key Constraint on profiles.employee_id
-- ============================================================================
-- This automatically clears the employee_id when an employee is deleted
-- Replaces manual unlinking code in deleteEmployee function

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_employee_id_fkey 
FOREIGN KEY (employee_id) 
REFERENCES public.employees(id) 
ON DELETE SET NULL;

-- ============================================================================
-- 2. Create Function to Sync full_name from employees to profiles
-- ============================================================================
-- This automatically updates profile.full_name when employee.full_name changes
-- Replaces manual syncing code in updateEmployee and auto-linking

CREATE OR REPLACE FUNCTION public.sync_employee_name_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- When employee full_name is updated, sync it to linked profile
  IF (TG_OP = 'UPDATE' AND OLD.full_name IS DISTINCT FROM NEW.full_name) OR TG_OP = 'INSERT' THEN
    UPDATE public.profiles
    SET full_name = NEW.full_name
    WHERE employee_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Create Trigger to Auto-Sync Names
-- ============================================================================
-- Fires whenever an employee record is inserted or updated

CREATE TRIGGER sync_employee_name_trigger
AFTER INSERT OR UPDATE OF full_name ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.sync_employee_name_to_profile();

-- ============================================================================
-- 4. One-time Sync of Existing Data
-- ============================================================================
-- Update all existing profiles with their linked employee names

UPDATE public.profiles p
SET full_name = e.full_name
FROM public.employees e
WHERE p.employee_id = e.id
  AND p.full_name IS DISTINCT FROM e.full_name;

-- ============================================================================
-- Notes:
-- ============================================================================
-- After running this migration, you can remove the following code:
-- 1. deleteEmployee: Remove manual unlinking (lines 393-401 in App.tsx)
-- 2. updateEmployee: Remove manual name sync (lines 390-395 in App.tsx)
-- 3. fetchUserProfile: Remove orphaned link checking (lines 92-107 in App.tsx)
-- 4. fetchUserProfile: Remove manual name syncing in auto-link (line 127 in App.tsx)
