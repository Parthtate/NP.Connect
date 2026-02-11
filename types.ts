import type { LucideIcon } from 'lucide-react';

export enum UserRole {
  ADMIN = 'ADMIN',
  HR = 'HR',
  EMPLOYEE = 'EMPLOYEE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  employeeId?: string; // Link to employee record
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  id: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  EMPLOYEES = 'EMPLOYEES',
  ATTENDANCE = 'ATTENDANCE',
  MY_ATTENDANCE = 'MY_ATTENDANCE',
  LEAVE = 'LEAVE',
  MY_LEAVES = 'MY_LEAVES',
  PAYROLL = 'PAYROLL',
  MY_PAYSLIPS = 'MY_PAYSLIPS',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE'
}

export interface Employee {
  id: string;
  fullName: string;
  mobile: string;
  email: string;
  department: string;
  designation: string;
  dateOfJoining: string;
  salary: {
    basic: number;
    hra: number;
    allowances: number;
    deductions: number;
  };
  bankAccount: {
    number: string;
    ifsc: string;
    bankName: string;
  };
}

export interface AttendanceRecord {
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day';
  checkIn?: string | null;
  checkOut?: string | null;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedOn: string;
  reviewedOn?: string;
}

export interface PayrollRecord {
  employeeId: string;
  month: string;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  adHocAllowance: number; // New field
  adHocDeduction: number; // New field
  workingDays: number;    // New field
  gross: number;
  net: number;
  presentDays: number;
  halfDays: number;
  totalDays: number;
  processedOn: string;
}

export interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  color?: string;
}

export interface CompanySettings {
  defaultWorkingDays: number;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

// New Attendance Module Types (Supabase)
export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  MISSING_SWIPE = 'MISSING_SWIPE',
  ON_LEAVE = 'ON_LEAVE'
}

export enum RegularizationStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum LeaveSession {
  FULL_DAY = 'FULL_DAY',
  FIRST_HALF = 'FIRST_HALF',
  SECOND_HALF = 'SECOND_HALF'
}

export interface AttendanceLog {
  id: string;
  user_id: string;
  employee_id: string | null;
  date: string;
  check_in: string;
  check_out: string | null;
  status: AttendanceStatus;
  is_late: boolean;
  work_duration_hours: number;
  leave_session: LeaveSession | null;
  regularization_status: RegularizationStatus;
  regularization_requested_at: string | null;
  regularization_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface RegularizationRequest {
  id: string;
  attendance_log_id: string;
  requester_id: string;
  proposed_check_out: string;
  reason: string;
  status: RegularizationStatus;
  admin_remarks: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceSummary {
  total_days: number;
  present_days: number;
  half_days: number;
  absent_days: number;
  missing_swipes: number;
  late_marks: number;
  total_hours: number;
}