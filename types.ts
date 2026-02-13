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
  PROFILE = 'PROFILE',
  DOCUMENTS = 'DOCUMENTS'
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
  accountStatus?: 'pending' | 'active' | 'suspended';
  leaveBalanceCurrentMonth?: number; // Cumulative paid leaves (2 added monthly, unused carry forward)
  leaveBalanceMonth?: string; // Month (YYYY-MM) when balance was last updated
}

export interface AttendanceRecord {
  employeeId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Half Day' | 'LEAVE' | 'HALF_DAY_LEAVE';
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
  session: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
  requestedOn: string;
  reviewedOn?: string;
  isPaid?: boolean; // Whether leave was paid (had sufficient balance) or unpaid
  daysCount?: number; // Number of days (0.5 for half-day, 1.0 for full-day)
}

export interface PayrollRecord {
  employeeId: string;
  month: string;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  adHocAllowance: number;
  adHocDeduction: number;
  workingDays: number;
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

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface DocumentUpload {
  file: File;
  documentType: string;
}
