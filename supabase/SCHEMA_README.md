# Database Schema Documentation

## Overview

This directory contains SQL schema files for the NP.Connect HRMS application. There are two schema files:

## Schema Files

### 1. `schema-invite-system.sql` (RECOMMENDED)

**Use this file for new deployments.**

This is the complete, production-ready schema that includes:

- **Invite-based authentication system** for employee onboarding
- **Comprehensive RLS (Row Level Security) policies** for all tables
- **Enhanced profiles table** with onboarding tracking
- **Updated employees table** with account status tracking
- **Invite tokens table** for managing employee invitations
- **Database functions** for invite validation and signup
- **Proper indexes** for performance optimization

**Features:**
- ✅ Role-based access control (ADMIN, HR, EMPLOYEE)
- ✅ Secure invite token generation and validation
- ✅ Automatic profile creation on user signup
- ✅ Employee account status tracking (pending, active, suspended)
- ✅ Audit trails for invitations

### 2. `schema.sql` (LEGACY)

This is the original, simpler schema without the invite system. It includes:

- Basic tables (profiles, employees, attendance, leaves, payroll, holidays, settings)
- Simple RLS policies allowing all authenticated users to view all data
- Basic profile creation trigger

**When to use:**
- Only use this if you specifically don't need the invite system
- For backwards compatibility with existing simple deployments

## Setup Instructions

### For New Deployments

1. Go to your Supabase Dashboard → SQL Editor
2. Copy the entire contents of `schema-invite-system.sql`
3. Paste and run in the SQL Editor
4. Verify all tables are created successfully
5. Check that RLS policies are enabled on all tables

### Migration from Legacy Schema

If you're currently using `schema.sql` and want to upgrade:

1. **Backup your database first!**
2. Review the differences between the schemas
3. Run `schema-invite-system.sql` (it includes DROP TABLE IF EXISTS statements)
4. Note: This will recreate tables, so you may lose data. Plan accordingly.

## Bug Fix Files

- `fix-bugs-round-2.sql` - Contains fixes for specific issues:
  - Enables HR to delete employees (not just ADMIN)
  - Creates the announcements table
  - Improves RLS policies

- `fix-onboarding-rls.sql` - Fixes for onboarding-related RLS policies
- `fix-profiles-rls.sql` - Fixes for profile access policies
- `fix-profiles-select.sql` - Fixes for profile selection policies
- `cleanup-invite-system.sql` - Cleanup script for invite system

These should be run AFTER the main schema is deployed, if needed.

## Database Tables Overview

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `profiles` | Links auth.users to app users | Stores role, employee_id, onboarding status |
| `employees` | Employee master data | Personal info, salary, bank details, account status |
| `invite_tokens` | Manages invitation system | Token generation, expiry, status tracking |
| `attendance` | Daily attendance records | Check-in/out times, status (Present/Absent/Half Day) |
| `leaves` | Leave applications | Leave type, dates, approval status |
| `payroll` | Monthly salary processing | Calculated salaries, deductions, allowances |
| `holidays` | Company holidays | Holiday dates and names |
| `announcements` | Company announcements | Admin/HR can post updates |
| `settings` | Global app settings | Default working days, etc. |

## Security & RLS Policies

All tables have Row Level Security (RLS) enabled with policies based on user roles:

- **ADMIN**: Full access to all data
- **HR**: Can manage employees, attendance, leaves, payroll
- **EMPLOYEE**: Can only view/modify their own data

## Support

For issues with database setup, check the main README.md troubleshooting section.
