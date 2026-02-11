-- =====================================================
-- NP.Connect HRMS - Production Database Schema
-- =====================================================
-- This schema matches the actual production Supabase database
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- DROP EXISTING TABLES (if recreating)
-- =====================================================
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS payroll_month_locks CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- PROFILES TABLE
-- =====================================================
CREATE TABLE profiles (
  id UUID NOT NULL,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'EMPLOYEE' CHECK (role IN ('ADMIN', 'HR', 'EMPLOYEE')),
  employee_id TEXT,
  avatar_url TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  first_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT profiles_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
);

-- =====================================================
-- EMPLOYEES TABLE
-- =====================================================
CREATE TABLE employees (
  id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  mobile TEXT,
  department TEXT,
  designation TEXT,
  date_of_joining DATE,
  salary_basic NUMERIC,
  salary_hra NUMERIC,
  salary_allowances NUMERIC,
  salary_deductions NUMERIC,
  bank_number TEXT,
  bank_ifsc TEXT,
  bank_name TEXT,
  account_status TEXT DEFAULT 'pending' CHECK (account_status IN ('pending', 'active', 'suspended')),
  invited_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT employees_pkey PRIMARY KEY (id)
);

-- =====================================================
-- ATTENDANCE TABLE
-- =====================================================
CREATE TABLE attendance (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  employee_id TEXT,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('Present', 'Absent', 'Half Day')),
  check_in TIME,
  check_out TIME,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE(employee_id, date)
);

-- =====================================================
-- LEAVES TABLE
-- =====================================================
CREATE TABLE leaves (
  id TEXT NOT NULL,
  employee_id TEXT,
  type TEXT,
  start_date DATE,
  end_date DATE,
  reason TEXT,
  status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  session TEXT DEFAULT 'FULL_DAY' CHECK (session IN ('FULL_DAY', 'FIRST_HALF', 'SECOND_HALF')),
  requested_on DATE DEFAULT CURRENT_DATE,
  reviewed_on DATE,
  CONSTRAINT leaves_pkey PRIMARY KEY (id),
  CONSTRAINT leaves_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- =====================================================
-- PAYROLL TABLE
-- =====================================================
CREATE TABLE payroll (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  employee_id TEXT,
  month TEXT NOT NULL,
  basic NUMERIC,
  hra NUMERIC,
  allowances NUMERIC,
  deductions NUMERIC,
  adhoc_allowance NUMERIC DEFAULT 0,
  adhoc_deduction NUMERIC DEFAULT 0,
  working_days INTEGER,
  gross NUMERIC,
  net NUMERIC,
  present_days INTEGER,
  half_days INTEGER,
  total_days INTEGER,
  processed_on TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT payroll_pkey PRIMARY KEY (id),
  CONSTRAINT payroll_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  UNIQUE(employee_id, month)
);

-- =====================================================
-- HOLIDAYS TABLE
-- =====================================================
CREATE TABLE holidays (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  name TEXT NOT NULL,
  CONSTRAINT holidays_pkey PRIMARY KEY (id)
);

-- =====================================================
-- ANNOUNCEMENTS TABLE
-- =====================================================
CREATE TABLE announcements (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT announcements_pkey PRIMARY KEY (id),
  CONSTRAINT announcements_created_by_fkey FOREIGN KEY (created_by) REFERENCES profiles(id)
);

-- =====================================================
-- SETTINGS TABLE
-- =====================================================
CREATE TABLE settings (
  id INTEGER NOT NULL DEFAULT 1 CHECK (id = 1),
  default_working_days INTEGER DEFAULT 26,
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);

-- Insert default settings
INSERT INTO settings (id, default_working_days) VALUES (1, 26)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PAYROLL MONTH LOCKS TABLE
-- =====================================================
CREATE TABLE payroll_month_locks (
  month DATE NOT NULL,
  locked BOOLEAN NOT NULL DEFAULT true,
  locked_by UUID,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT payroll_month_locks_pkey PRIMARY KEY (month)
);

-- =====================================================
-- ACTIVITY LOGS TABLE
-- =====================================================
CREATE TABLE activity_logs (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  actor_user_id UUID,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'EMPLOYEE')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger to sync employee name to profile
CREATE OR REPLACE FUNCTION sync_employee_name_to_profile()
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

DROP TRIGGER IF EXISTS sync_employee_name_trigger ON employees;
CREATE TRIGGER sync_employee_name_trigger
  AFTER INSERT OR UPDATE OF full_name ON employees
  FOR EACH ROW EXECUTE FUNCTION sync_employee_name_to_profile();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_month_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- PROFILES Policies
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "ADMIN can manage all profiles" ON profiles
  FOR ALL USING (get_user_role() = 'ADMIN');

-- EMPLOYEES Policies
CREATE POLICY "All authenticated users can view employees" ON employees
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "HR and ADMIN can insert employees" ON employees
  FOR INSERT WITH CHECK (get_user_role() IN ('HR', 'ADMIN'));

CREATE POLICY "HR and ADMIN can update employees" ON employees
  FOR UPDATE USING (get_user_role() IN ('HR', 'ADMIN'));

CREATE POLICY "HR and ADMIN can delete employees" ON employees
  FOR DELETE USING (get_user_role() IN ('HR', 'ADMIN'));

-- ATTENDANCE Policies
CREATE POLICY "All authenticated users can view attendance" ON attendance
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "HR and ADMIN can manage all attendance" ON attendance
  FOR ALL USING (get_user_role() IN ('HR', 'ADMIN'));

CREATE POLICY "Employees can manage own attendance" ON attendance
  FOR ALL USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- LEAVES Policies
CREATE POLICY "All authenticated users can view leaves" ON leaves
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Employees can insert own leaves" ON leaves
  FOR INSERT WITH CHECK (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "HR and ADMIN can update leaves" ON leaves
  FOR UPDATE USING (get_user_role() IN ('HR', 'ADMIN'));

CREATE POLICY "HR and ADMIN can delete leaves" ON leaves
  FOR DELETE USING (get_user_role() IN ('HR', 'ADMIN'));

-- PAYROLL Policies
CREATE POLICY "Employees can view own payroll" ON payroll
  FOR SELECT USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
    OR get_user_role() IN ('HR', 'ADMIN')
  );

CREATE POLICY "HR and ADMIN can manage payroll" ON payroll
  FOR ALL USING (get_user_role() IN ('HR', 'ADMIN'));

-- HOLIDAYS Policies
CREATE POLICY "All authenticated users can view holidays" ON holidays
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ADMIN can manage holidays" ON holidays
  FOR ALL USING (get_user_role() = 'ADMIN');

CREATE POLICY "HR can manage holidays" ON holidays
  FOR ALL USING (get_user_role() = 'HR');

-- ANNOUNCEMENTS Policies
CREATE POLICY "All authenticated users can view announcements" ON announcements
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "HR and ADMIN can create announcements" ON announcements
  FOR INSERT WITH CHECK (get_user_role() IN ('HR', 'ADMIN'));

CREATE POLICY "HR and ADMIN can delete announcements" ON announcements
  FOR DELETE USING (get_user_role() IN ('HR', 'ADMIN'));

-- SETTINGS Policies
CREATE POLICY "All authenticated users can view settings" ON settings
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ADMIN can update settings" ON settings
  FOR UPDATE USING (get_user_role() = 'ADMIN');

-- PAYROLL MONTH LOCKS Policies
CREATE POLICY "All authenticated users can view locks" ON payroll_month_locks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "HR and ADMIN can manage locks" ON payroll_month_locks
  FOR ALL USING (get_user_role() IN ('HR', 'ADMIN'));

-- ACTIVITY LOGS Policies
CREATE POLICY "HR and ADMIN can view activity logs" ON activity_logs
  FOR SELECT USING (get_user_role() IN ('HR', 'ADMIN'));

CREATE POLICY "All authenticated users can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_employee_id ON profiles(employee_id);

-- Employees indexes
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_account_status ON employees(account_status);

-- Attendance indexes
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);

-- Leaves indexes
CREATE INDEX idx_leaves_employee ON leaves(employee_id);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_leaves_dates ON leaves(start_date, end_date);

-- Payroll indexes
CREATE INDEX idx_payroll_employee_month ON payroll(employee_id, month);
CREATE INDEX idx_payroll_month ON payroll(month);

-- Holidays indexes
CREATE INDEX idx_holidays_date ON holidays(date);

-- Announcements indexes
CREATE INDEX idx_announcements_date ON announcements(date);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_actor ON activity_logs(actor_user_id);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Production database schema created successfully!';
  RAISE NOTICE 'Tables created: 10 tables including activity_logs and payroll_month_locks';
  RAISE NOTICE 'RLS policies enabled on all tables';
  RAISE NOTICE 'Indexes created for optimal performance';
  RAISE NOTICE 'Employee ID format: TEXT (e.g., EMP12345)';
END $$;
