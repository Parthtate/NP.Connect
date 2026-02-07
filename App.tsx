import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, Employee, AttendanceRecord, LeaveRequest, PayrollRecord, CompanySettings, Holiday, Announcement } from './types';
import { APP_NAME } from './constants';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import AttendanceView from './components/AttendanceView';
import LeaveView from './components/LeaveView';
import PayrollView from './components/PayrollView';
import SettingsView from './components/SettingsView';
import Reports from './components/Reports';
import { ShieldCheck, User as UserIcon, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isLoading, setIsLoading] = useState(true);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Application Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<Record<string, PayrollRecord>>({});
  const [settings, setSettings] = useState<CompanySettings>({ defaultWorkingDays: 26 });
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // --- INITIALIZATION ---

  useEffect(() => {
    // Check active session
    // Cast to any to handle potential type definition mismatches
    (supabase.auth as any).getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = (supabase.auth as any).onAuthStateChange((_event: any, session: any) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all app data when user is authenticated
  useEffect(() => {
    if (currentUser) {
      fetchEmployees();
      fetchAttendance();
      fetchLeaves();
      fetchPayroll();
      fetchSettings();
      fetchAnnouncements();
    }
  }, [currentUser]);

  // --- DATA FETCHING (SUPABASE) ---

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentUser({
          id: data.id,
          name: data.full_name || data.email,
          email: data.email,
          role: data.role as UserRole,
          employeeId: data.employee_id
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from('employees').select('*');
    if (data) {
      // Map Snake_case DB to CamelCase Frontend
      const mapped = data.map((e: any) => ({
        id: e.id,
        fullName: e.full_name,
        mobile: e.mobile,
        email: e.email,
        department: e.department,
        designation: e.designation,
        dateOfJoining: e.date_of_joining,
        salary: {
          basic: e.salary_basic,
          hra: e.salary_hra,
          allowances: e.salary_allowances,
          deductions: e.salary_deductions
        },
        bankAccount: {
          number: e.bank_number,
          ifsc: e.bank_ifsc,
          bankName: e.bank_name
        }
      }));
      setEmployees(mapped);
    }
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase.from('attendance').select('*');
    if (data) {
      const recordMap: Record<string, AttendanceRecord> = {};
      data.forEach((a: any) => {
        const key = `${a.employee_id}-${a.date}`;
        recordMap[key] = {
          employeeId: a.employee_id,
          date: a.date,
          status: a.status,
          checkIn: a.check_in,
          checkOut: a.check_out
        };
      });
      setAttendance(recordMap);
    }
  };

  const fetchLeaves = async () => {
    const { data } = await supabase.from('leaves').select('*');
    if (data) {
      const mapped = data.map((l: any) => ({
        id: l.id,
        employeeId: l.employee_id,
        type: l.type,
        startDate: l.start_date,
        endDate: l.end_date,
        reason: l.reason,
        status: l.status,
        requestedOn: l.requested_on,
        reviewedOn: l.reviewed_on
      }));
      setLeaves(mapped);
    }
  };

  const fetchPayroll = async () => {
    const { data } = await supabase.from('payroll').select('*');
    if (data) {
      const recordMap: Record<string, PayrollRecord> = {};
      data.forEach((p: any) => {
        const key = `${p.employee_id}-${p.month}`;
        recordMap[key] = {
          employeeId: p.employee_id,
          month: p.month,
          basic: p.basic,
          hra: p.hra,
          allowances: p.allowances,
          deductions: p.deductions,
          adHocAllowance: p.adhoc_allowance,
          adHocDeduction: p.adhoc_deduction,
          workingDays: p.working_days,
          gross: p.gross,
          net: p.net,
          presentDays: p.present_days,
          halfDays: p.half_days,
          totalDays: p.total_days,
          processedOn: p.processed_on
        };
      });
      setPayroll(recordMap);
    }
  };

  const fetchHolidays = async () => {
    const { data } = await supabase.from('holidays').select('*');
    if (data) setHolidays(data);
  };

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').single();
    if (data) setSettings({ defaultWorkingDays: data.default_working_days });
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('date', { ascending: false });
    if (data) setAnnouncements(data);
  };

  // --- ACTIONS (SUPABASE PERSISTENCE) ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    setLoginError('');
    
    try {
      const { error } = await (supabase.auth as any).signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) throw error;
      // Session listener will handle the rest
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await (supabase.auth as any).signOut();
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  const addEmployee = async (data: Omit<Employee, 'id'>) => {
    const newId = 'EMP' + Date.now().toString().slice(-5);
    
    const dbPayload = {
      id: newId,
      full_name: data.fullName,
      mobile: data.mobile,
      email: data.email,
      department: data.department,
      designation: data.designation,
      date_of_joining: data.dateOfJoining,
      salary_basic: data.salary.basic,
      salary_hra: data.salary.hra,
      salary_allowances: data.salary.allowances,
      salary_deductions: data.salary.deductions,
      bank_number: data.bankAccount.number,
      bank_ifsc: data.bankAccount.ifsc,
      bank_name: data.bankAccount.bankName
    };

    const { error } = await supabase.from('employees').insert(dbPayload);
    
    if (error) {
      alert('Error adding employee: ' + error.message);
    } else {
      fetchEmployees();
    }
  };

  const updateEmployee = async (data: Employee) => {
    const dbPayload = {
      full_name: data.fullName,
      mobile: data.mobile,
      email: data.email,
      department: data.department,
      designation: data.designation,
      date_of_joining: data.dateOfJoining,
      salary_basic: data.salary.basic,
      salary_hra: data.salary.hra,
      salary_allowances: data.salary.allowances,
      salary_deductions: data.salary.deductions,
      bank_number: data.bankAccount.number,
      bank_ifsc: data.bankAccount.ifsc,
      bank_name: data.bankAccount.bankName
    };

    const { error } = await supabase.from('employees').update(dbPayload).eq('id', data.id);
    if (!error) fetchEmployees();
  };

  const deleteEmployee = async (id: string) => {
    // Check if HR (or Admin)
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) {
      // Also cleanup profile if exists (auto-cascade often handles this, but good to be safe)
      // Actually, RLS handles it.
      fetchEmployees();
      alert('Employee deleted successfully.');
    } else {
      alert('Error deleting employee: ' + error.message);
    }
  };

  const markAttendance = async (employeeId: string, date: string, status: 'Present' | 'Absent' | 'Half Day') => {
    const payload = {
      employee_id: employeeId,
      date,
      status,
      check_in: status !== 'Absent' ? '09:00:00' : null,
      check_out: status === 'Present' ? '18:00:00' : (status === 'Half Day' ? '13:00:00' : null)
    };

    const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'employee_id,date' });
    if (!error) fetchAttendance();
  };

  const employeeCheckIn = async () => {
    if (!currentUser?.employeeId) {
      alert('Error: Your account is not linked to an employee record.');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('en-US', {hour12: false});

    const payload = {
      employee_id: currentUser.employeeId,
      date: today,
      status: 'Present',
      check_in: timeNow
    };

    const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'employee_id,date' });
    if (!error) fetchAttendance();
    else alert('Check-in failed: ' + error.message);
  };

  const employeeCheckOut = async () => {
    if (!currentUser?.employeeId) return;
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('en-US', {hour12: false});

    // We update the existing record
    const { error } = await supabase
      .from('attendance')
      .update({ check_out: timeNow })
      .eq('employee_id', currentUser.employeeId)
      .eq('date', today);

    if (!error) fetchAttendance();
  };

  const employeeMarkHalfDay = async () => {
    if (!currentUser?.employeeId) return;
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('en-US', {hour12: false});

    const payload = {
      employee_id: currentUser.employeeId,
      date: today,
      status: 'Half Day',
      check_in: timeNow
    };

    const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'employee_id,date' });
    if (!error) fetchAttendance();
  };

  const applyLeave = async (leaveData: any) => {
    const newId = 'L' + Date.now().toString().slice(-5);
    const payload = {
      id: newId,
      employee_id: leaveData.employeeId,
      type: leaveData.type,
      start_date: leaveData.startDate,
      end_date: leaveData.endDate,
      reason: leaveData.reason,
      status: 'Pending',
      requested_on: new Date().toISOString().split('T')[0]
    };

    const { error } = await supabase.from('leaves').insert(payload);
    if (!error) fetchLeaves();
  };

  const updateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    const { error } = await supabase
      .from('leaves')
      .update({ status, reviewed_on: new Date().toISOString().split('T')[0] })
      .eq('id', id);
    if (!error) fetchLeaves();
  };

  const processPayroll = async (month: string, workingDays: number, adjustments: Record<string, { allowance: number, deduction: number }>) => {
    const newPayrollRecords = employees.map(emp => {
       // Calculate Summary for Month
       let present = 0, halfDay = 0, absent = 0;
       Object.values(attendance).forEach((att: AttendanceRecord) => {
          if (att.employeeId === emp.id && att.date.startsWith(month)) {
             if (att.status === 'Present') present++;
             else if (att.status === 'Half Day') halfDay++;
             else absent++;
          }
       });

       const effectiveDays = present + (halfDay * 0.5);
       const { basic, hra, allowances, deductions } = emp.salary;
       const adj = adjustments[emp.id] || { allowance: 0, deduction: 0 };
       
       const totalSalary = basic + hra + allowances;
       const perDaySalary = totalSalary / workingDays;
       const earnedSalary = perDaySalary * effectiveDays;
       
       const gross = earnedSalary + adj.allowance;
       const net = gross - deductions - adj.deduction;

       return {
           employee_id: emp.id,
           month,
           basic: (basic / workingDays) * effectiveDays,
           hra: (hra / workingDays) * effectiveDays,
           allowances: (allowances / workingDays) * effectiveDays,
           deductions,
           adhoc_allowance: adj.allowance,
           adhoc_deduction: adj.deduction,
           working_days: workingDays,
           gross,
           net,
           present_days: present,
           half_days: halfDay,
           total_days: present + halfDay + absent,
           processed_on: new Date().toISOString()
       };
    });

    const { error } = await supabase.from('payroll').upsert(newPayrollRecords, { onConflict: 'employee_id,month' });
    if (error) {
      alert('Error processing payroll: ' + error.message);
    } else {
      fetchPayroll();
      alert(`Payroll processed for ${month} successfully!`);
    }
  };

  const addHoliday = async (holiday: Omit<Holiday, 'id'>) => {
    const { error } = await supabase.from('holidays').insert({ date: holiday.date, name: holiday.name });
    if (!error) fetchHolidays();
  };
  
  const deleteHoliday = async (id: string) => {
    const { error } = await supabase.from('holidays').delete().eq('id', id);
    if (!error) fetchHolidays();
  };

  const addAnnouncement = async (announcement: Omit<Announcement, 'id'>) => {
    const { error } = await supabase.from('announcements').insert({
        title: announcement.title,
        content: announcement.content,
        date: announcement.date,
        created_by: currentUser?.id
    });
    if (!error) fetchAnnouncements();
  };

  const deleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) fetchAnnouncements();
  };

  // --- RENDER ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg shadow-blue-600/30">
              <ShieldCheck className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{APP_NAME}</h1>
            <p className="text-slate-500 mt-2 text-sm">Secure Employee Management System</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-white text-slate-900 placeholder-slate-400"
                    placeholder="name@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  className="block w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-white text-slate-900 placeholder-slate-400"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
              </div>

              {loginError && (
                <div className="text-red-500 text-xs flex items-center gap-1 bg-red-50 p-2 rounded">
                  <ShieldCheck size={12} /> {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoginLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-70"
              >
                {isLoginLoading ? <Loader2 className="animate-spin" size={18} /> : <span>Sign In <ArrowRight size={16} /></span>}
              </button>
            </form>

            {/* Magic Link Option */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">or</span>
                </div>
              </div>
              <p className="mt-4 text-center text-sm text-slate-600">
                Employee?{' '}
                <a
                  href="/magic-link"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Use passwordless login
                </a>
              </p>
            </div>

            <div className="mt-8 text-center text-xs text-slate-400">
               <p>Use Supabase Authentication to sign in.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Router Logic
  const renderContent = () => {
      switch (currentView) {
          case ViewState.DASHBOARD:
              return <Dashboard 
                  user={currentUser} 
                  employees={employees} 
                  attendance={attendance} 
                  leaves={leaves}
                  holidays={holidays}
                  announcements={announcements}
                  onCheckIn={employeeCheckIn}
                  onCheckOut={employeeCheckOut}
                  onMarkHalfDay={employeeMarkHalfDay}
                  onViewAllEmployees={() => setCurrentView(ViewState.EMPLOYEES)}
                  onAddAnnouncement={addAnnouncement}
                  onDeleteAnnouncement={deleteAnnouncement}
              />;
          case ViewState.EMPLOYEES:
              return <EmployeeList 
                  employees={employees} 
                  onAddEmployee={addEmployee}
                  onUpdateEmployee={updateEmployee}
                  onDeleteEmployee={deleteEmployee}
              />;
          case ViewState.ATTENDANCE: // HR View
          case ViewState.MY_ATTENDANCE: // Employee View
              return <AttendanceView 
                  role={currentUser.role}
                  employees={employees}
                  attendance={attendance}
                  currentEmployeeId={currentUser.employeeId}
                  onMarkAttendance={markAttendance}
              />;
          case ViewState.LEAVE: // HR View
          case ViewState.MY_LEAVES: // Employee View
              return <LeaveView 
                  role={currentUser.role}
                  leaves={leaves}
                  employees={employees}
                  currentEmployeeId={currentUser.employeeId}
                  onApplyLeave={applyLeave}
                  onUpdateStatus={updateLeaveStatus}
              />;
          case ViewState.PAYROLL:
          case ViewState.MY_PAYSLIPS:
              return <PayrollView 
                   role={currentUser.role}
                   employees={employees}
                   payroll={payroll}
                   currentEmployeeId={currentUser.employeeId}
                   settings={settings}
                   onProcessPayroll={processPayroll}
              />;
          case ViewState.SETTINGS:
              return <SettingsView 
                   settings={settings}
                   holidays={holidays}
                   onUpdateSettings={(s) => {
                     supabase.from('settings').update({ default_working_days: s.defaultWorkingDays }).eq('id', 1).then(() => fetchSettings());
                   }}
                   onAddHoliday={addHoliday}
                   onDeleteHoliday={deleteHoliday}
              />
          case ViewState.REPORTS:
              return <Reports 
                  employees={employees}
                  attendance={attendance}
                  leaves={leaves}
                  payroll={payroll}
              />;
          default:
              return <div>View not implemented yet</div>;
      }
  };

  return (
    <Layout 
      user={currentUser} 
      currentView={currentView} 
      onChangeView={setCurrentView}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;