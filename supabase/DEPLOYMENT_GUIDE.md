# Database Schema - Deployment Guide

## Quick Start

### 1. Deploy Schema to Supabase

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `schema.sql`
4. Paste and click **Run**
5. Wait for completion message

### 2. Create Initial Admin User

After deploying the schema, you need to create an admin account:

#### Option A: Via Supabase Dashboard
1. Go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter email and password
4. Click **Create user**
5. Go to **Table Editor** → **profiles** table
6. Find the new user's row
7. Edit the `role` column to `ADMIN`

#### Option B: Via SQL
```sql
-- After the user signs up through the app, run this:
UPDATE profiles 
SET role = 'ADMIN' 
WHERE email = 'your-admin-email@example.com';
```

### 3. Verify Setup

Run this verification query in SQL Editor:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'employees', 'attendance', 'leaves', 'payroll', 'holidays', 'announcements', 'settings')
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'employees', 'attendance', 'leaves', 'payroll', 'holidays', 'announcements', 'settings');

-- Check settings row exists
SELECT * FROM settings;
```

Expected results:
- ✅ 8 tables listed
- ✅ All tables have `rowsecurity = true`
- ✅ Settings row with `default_working_days = 26`

## Schema Overview

### Tables Created

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `profiles` | User accounts | role, employee_id |
| `employees` | Employee master data | salary fields, bank details |
| `attendance` | Daily attendance | check_in, check_out, status |
| `leaves` | Leave management | type, dates, status |
| `payroll` | Salary processing | gross, net, deductions |
| `holidays` | Company holidays | date, name |
| `announcements` | Company news | title, content |
| `settings` | App configuration | default_working_days |

### Security Features

✅ **Row Level Security (RLS)** enabled on all tables
✅ **Role-based access control** (ADMIN, HR, EMPLOYEE)
✅ **Auto-profile creation** on user signup
✅ **Email auto-linking** for employees (in app code)

### Role Permissions

**ADMIN:**
- Full access to all data
- Can manage settings
- Can manage all users

**HR:**
- Can manage employees
- Can manage attendance, leaves, payroll
- Can create announcements
- Can manage holidays

**EMPLOYEE:**
- Can view own data
- Can mark own attendance
- Can apply for leaves
- Can view payroll slips
- Can view holidays and announcements

## Troubleshooting

### Issue: RLS policies blocking access

**Solution:** Ensure user has correct role in profiles table:
```sql
SELECT id, email, role FROM profiles WHERE email = 'problematic-user@example.com';
```

### Issue: Employee data not visible

**Solution:** Check employee_id link in profiles:
```sql
SELECT p.email, p.role, p.employee_id, e.full_name 
FROM profiles p 
LEFT JOIN employees e ON p.employee_id = e.id 
WHERE p.email = 'employee@example.com';
```

### Issue: Triggers not working

**Solution:** Recreate the handle_new_user trigger:
```sql
-- Run the trigger creation code from schema.sql again
```

## Migration from Existing Data

If you have existing data in your database:

1. **Backup first!**
   ```bash
   # Via Supabase CLI
   supabase db dump > backup.sql
   ```

2. **Review data** before running schema.sql (it has DROP TABLE commands)

3. **Modify schema.sql** if needed:
   - Comment out DROP TABLE lines if you want to preserve data
   - Or export data first, run schema, then re-import

## Next Steps After Deployment

1. ✅ Create admin account
2. ✅ Login as admin
3. ✅ Add employees via HR dashboard
4. ✅ Test employee magic link login
5. ✅ Verify auto-linking works
6. ✅ Test all RBAC permissions

## Support

For database issues, check:
- Supabase logs (Settings → Database → Logs)
- RLS policy violations (will show as "permission denied" errors)
- Trigger execution (check if profiles are being created)
