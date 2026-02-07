# Database Schema Verification Checklist

## Pre-Deployment Checklist

- [ ] Backup existing database (if applicable)
- [ ] Review schema.sql file
- [ ] Ensure Supabase project is ready
- [ ] Have admin email ready for first account

## Deployment Checklist

- [ ] Open Supabase SQL Editor
- [ ] Run schema.sql completely
- [ ] Verify no errors in execution
- [ ] Check completion message appears

## Post-Deployment Verification

### 1. Tables Created
Run and verify all 8 tables exist:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'employees', 'attendance', 'leaves', 'payroll', 'holidays', 'announcements', 'settings')
ORDER BY table_name;
```

- [ ] announcements
- [ ] attendance
- [ ] employees
- [ ] holidays
- [ ] leaves
- [ ] payroll
- [ ] profiles
- [ ] settings

### 2. RLS Enabled
Verify all tables have RLS enabled:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'employees', 'attendance', 'leaves', 'payroll', 'holidays', 'announcements', 'settings');
```

- [ ] All tables show `rowsecurity = true`

### 3. Indexes Created
Check indexes exist:
```sql
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'employees', 'attendance', 'leaves', 'payroll', 'holidays', 'announcements')
ORDER BY tablename, indexname;
```

- [ ] Indexes created for key fields

### 4. Triggers Active
Verify triggers exist:
```sql
SELECT trigger_name, event_object_table FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

- [ ] `on_auth_user_created` trigger exists
- [ ] Update timestamp triggers exist

### 5. Settings Initialized
```sql
SELECT * FROM settings;
```

- [ ] Settings row exists with id=1
- [ ] default_working_days = 26

### 6. Policies Created
Check RLS policies:
```sql
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

- [ ] Multiple policies per table
- [ ] Policies for SELECT, INSERT, UPDATE, DELETE as appropriate

## Functionality Testing Checklist

### Admin Account Setup
- [ ] Create first admin user via Supabase Auth
- [ ] Verify profile created automatically
- [ ] Update profile role to 'ADMIN' in profiles table
- [ ] Login to application with admin account
- [ ] Dashboard shows "Admin Dashboard"
- [ ] All navigation items visible

### Employee Management (as ADMIN/HR)
- [ ] Can create new employee
- [ ] Employee appears in employees table
- [ ] Can update employee details
- [ ] Can delete employee

### Employee Auto-Linking
- [ ] Create employee with email
- [ ] Employee receives magic link (via Supabase Auth)
- [ ] Employee logs in via magic link
- [ ] Profile automatically links to employee_id
- [ ] Employee can access their dashboard
- [ ] No "account not linked" error

### Attendance Testing
- [ ] Employee can check in
- [ ] Check-in time recorded correctly
- [ ] Employee can check out
- [ ] Check-out time recorded correctly
- [ ] Employee can mark half-day
- [ ] HR can view all attendance
- [ ] HR can mark attendance for employees

### Leave Management
- [ ] Employee can apply for leave
- [ ] HR can view pending leaves
- [ ] HR can approve leave
- [ ] HR can reject leave
- [ ] Employee sees updated leave status

### Payroll
- [ ] HR can process payroll
- [ ] Payroll calculation correct
- [ ] Employee can view own payslip
- [ ] Employee cannot view others' payslips
- [ ] Can download payslip as PDF

### Holidays & Announcements
- [ ] HR can add holiday
- [ ] Holiday appears for all users
- [ ] Holiday appears in employee dashboard
- [ ] HR can create announcement
- [ ] Announcement visible to employees
- [ ] HR can delete announcement

### Settings
- [ ] ADMIN can access settings
- [ ] HR cannot access settings
- [ ] ADMIN can update default working days
- [ ] Settings persist after save

## Security Testing

### Role-Based Access
- [ ] EMPLOYEE cannot access employee list
- [ ] EMPLOYEE cannot access payroll processing
- [ ] EMPLOYEE cannot access settings
- [ ] HR cannot access settings
- [ ] HR can access employee management
- [ ] ADMIN can access everything

### Data Isolation
- [ ] Employee A cannot see Employee B's payroll
- [ ] Employee can only edit own attendance
- [ ] Direct SQL queries respect RLS

### Common Issues Checklist

If you encounter issues:

#### "Permission denied" errors
- [ ] Check RLS policies are created
- [ ] Verify user role in profiles table
- [ ] Check get_user_role() function works

#### Profile not created on signup
- [ ] Verify trigger exists: `on_auth_user_created`
- [ ] Check trigger is AFTER INSERT
- [ ] Verify function handle_new_user() exists

#### Employee account linking not working
- [ ] Check employee email matches auth email exactly
- [ ] Verify employee_id column exists in profiles
- [ ] Check foreign key constraint is set

#### Holidays not showing
- [ ] Verify fetchHolidays() is called on app load
- [ ] Check holiday date is in future
- [ ] Refresh page after adding holiday

## Sign-Off

- [ ] All tables verified
- [ ] All RLS policies working
- [ ] All triggers functional
- [ ] Admin account created and working
- [ ] HR workflow tested
- [ ] Employee workflow tested
- [ ] No security issues found
- [ ] Schema deployed successfully ✅

**Deployed by:** ___________________
**Date:** ___________________
**Supabase Project:** ___________________
