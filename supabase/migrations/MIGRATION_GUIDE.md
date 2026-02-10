# Database Migration Guide

## Overview
This migration implements **root-level fixes** to replace code patches with proper database constraints and triggers.

## What This Migration Does

### 1. Foreign Key Constraint (`profiles.employee_id`)
**Before:** No constraint - profiles could reference deleted employees  
**After:** Automatic `SET NULL` when employee is deleted  
**Benefit:** No more orphaned employee_id references

### 2. Auto-Sync Trigger (`full_name`)
**Before:** Manual syncing in code when employee name changes  
**After:** Database automatically syncs employee name to linked profile  
**Benefit:** Names always stay in sync, no manual code needed

---

## How to Run the Migration

### ⚠️ IMPORTANT: Run in Production Supabase

This migration file is designed for **PRODUCTION** (your existing data). Run it in your Supabase  dashboard, NOT locally.

### Steps:

1. **Backup Your Database** (Recommended)
   - Go to Supabase Dashboard → Database → Backups
   - Create a manual backup before proceeding

2. **Open SQL Editor**
   - Supabase Dashboard → SQL Editor
   - Click "New query"

3. **Run the Migration**
   - Copy contents of `supabase/migrations/20260209_add_constraints_and_triggers.sql`
   - Paste into SQL Editor
   - Click "Run"

4. **Verify Success**
   - Check for green success message
   - No errors should appear

---

## After Migration: Code Cleanup

Once the migration runs successfully, you can **remove the code patches**:

### Files to Update: `App.tsx`

#### 1. **deleteEmployee** - Remove manual unlinking (lines ~393-401)
```typescript
// REMOVE THIS BLOCK:
const { error: unlinkError } = await supabase
  .from('profiles')
  .update({ employee_id: null })
  .eq('employee_id', id);

if (unlinkError) {
  console.warn('Warning: Could not unlink profile:', unlinkError.message);
}
```

**Keep only:**
```typescript
const deleteEmployee = async (id: string) => {
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (!error) {
    fetchEmployees();
  } else {
    console.error('Error deleting employee:', error.message);
  }
};
```

---

#### 2. **updateEmployee** - Remove manual name sync (lines ~389-395)
```typescript
// REMOVE THIS BLOCK:
await supabase
  .from('profiles')
  .update({ full_name: data.fullName })
  .eq('employee_id', data.id);

console.log('Updated employee and synced name to profile');
```

**Keep only:**
```typescript
const { error } = await supabase.from('employees').update(dbPayload).eq('id', data.id);
if (!error) fetchEmployees();
```

---

#### 3. **fetchUserProfile** - Simplify auto-linking (lines ~92-134)

**REMOVE orphaned link checking:**
```typescript
// REMOVE THIS ENTIRE BLOCK:
if (employeeId) {
  const { data: existingEmp } = await supabase
    .from('employees')
    .select('id')
    .eq('id', employeeId)
    .single();
  
  if (!existingEmp) {
    employeeId = null;
    await supabase
      .from('profiles')
      .update({ employee_id: null })
      .eq('id', userId);
    console.log('Cleared orphaned employee link');
  }
}
```

**SIMPLIFY auto-linking:**
```typescript
// REMOVE manual name sync from auto-linking:
await supabase
  .from('profiles')
  .update({ 
    employee_id: empData.id,
    full_name: empData.full_name  // REMOVE THIS LINE
  })
  .eq('id', userId);

data.full_name = empData.full_name; // REMOVE THIS LINE TOO
```

**KEEP only:**
```typescript
await supabase
  .from('profiles')
  .update({ employee_id: empData.id })
  .eq('id', userId);
```

---

## Testing After Migration

1. **Test Employee Deletion:**
   - Delete an employee
   - Login as that employee → profile should work (employee_id auto-cleared)

2. **Test Name Changes:**
   - Edit employee name in HR dashboard
   - Logout/login as that employee → name should update automatically

3. **Test Employee Recreation:**
   - Delete employee, recreate with same email
   - Login → should auto-link to new employee_id

---

## Rollback (If Needed)

If something goes wrong, you can rollback:

```sql
-- Remove the constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_employee_id_fkey;

-- Remove the trigger
DROP TRIGGER IF EXISTS sync_employee_name_trigger ON employees;

-- Remove the function
DROP FUNCTION IF EXISTS sync_employee_name_to_profile();
```

Then restore your backup.
