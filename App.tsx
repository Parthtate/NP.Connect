import React, { useState, useEffect } from 'react';
import { User, UserRole, ViewState, Employee, AttendanceRecord, LeaveRequest, PayrollRecord, CompanySettings, Holiday, Announcement, EmployeeDocument, DocumentUpload } from './types';
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
import { supabase, supabaseUrl } from './lib/supabaseClient';

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
  const [employeeDocuments, setEmployeeDocuments] = useState<Record<string, EmployeeDocument[]>>({});

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
      // Reset login loading state
      setIsLoginLoading(false);
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
      fetchHolidays();
      fetchSettings();
      fetchAnnouncements();
      fetchEmployeeDocuments();
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
        reviewedOn: l.reviewed_on,
        session: l.session || 'FULL_DAY'
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

  const fetchEmployeeDocuments = async (employeeId?: string) => {
    let query = supabase.from('employee_documents').select('*');
    if (employeeId) query = query.eq('employee_id', employeeId);
    
    const { data } = await query;
    if (data) {
      const docsMap: Record<string, EmployeeDocument[]> = {};
      if (employeeId) {
        // If fetching for specific employee, keep other employees' docs
        Object.assign(docsMap, employeeDocuments);
      }
      
      data.forEach((doc: any) => {
        if (!docsMap[doc.employee_id]) {
          docsMap[doc.employee_id] = [];
        }
        // Check if doc already exists to avoid duplicates if merging
        if (!docsMap[doc.employee_id].find(d => d.id === doc.id)) {
          docsMap[doc.employee_id].push({
            id: doc.id,
            employeeId: doc.employee_id,
            documentType: doc.document_type,
            fileName: doc.file_name,
            filePath: doc.file_path,
            fileSize: doc.file_size,
            mimeType: doc.mime_type,
            uploadedBy: doc.uploaded_by,
            uploadedAt: doc.uploaded_at
          });
        }
      });
      setEmployeeDocuments(prev => ({...prev, ...docsMap}));
    }
  };

  const uploadEmployeeDocuments = async (
    employeeId: string, 
    documents: DocumentUpload[]
  ) => {
    for (const doc of documents) {
      const fileExt = doc.file.name.split('.').pop();
      const fileName = `${doc.documentType}_${Date.now()}.${fileExt}`;
      const filePath = `${employeeId}/${fileName}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('employee-documents')
        .upload(filePath, doc.file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading document:', uploadError);
        continue;
      }
      
      // Save metadata to database
      await supabase.from('employee_documents').insert({
        employee_id: employeeId,
        document_type: doc.documentType,
        file_name: doc.file.name,
        file_path: filePath,
        file_size: doc.file.size,
        mime_type: doc.file.type,
        uploaded_by: currentUser?.id
      });
    }
    
    fetchEmployeeDocuments(employeeId);
  };

  const deleteEmployeeDocument = async (documentId: string, filePath: string) => {
    // Delete from storage
    const { error: storageError } = await supabase.storage.from('employee-documents').remove([filePath]);
    
    if (storageError) {
       console.error('Error deleting file from storage:', storageError);
    }
    
    // Delete from database
    const { error: dbError } = await supabase.from('employee_documents').delete().eq('id', documentId);

    if (dbError) {
      console.error('Error deleting document metadata:', dbError);
    }
    
    // Refresh documents
    // Extract employeeId from filePath (it's the first part) or just refetch all
    fetchEmployeeDocuments();
  };

  const getDocumentSignedUrl = async (filePath: string) => {
    const { data } = await supabase.storage
      .from('employee-documents')
      .createSignedUrl(filePath, 86400); // 24 hours expiry
    
    return data?.signedUrl || null;
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
    // Clear all application state first
    setEmployees([]);
    setAttendance({});
    setLeaves([]);
    setPayroll({});
    setHolidays([]);
    setAnnouncements([]);
    setSettings({ defaultWorkingDays: 26 });
    
    // Clear login form
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    
    // Sign out from Supabase (this will trigger the auth state listener)
    await (supabase.auth as any).signOut();
    
    // Clear current user (auth listener will also do this, but we do it explicitly)
    setCurrentUser(null);
  };

  const addEmployee = async (data: Omit<Employee, 'id'>, documents?: DocumentUpload[]) => {
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
      console.error('Error adding employee:', error.message);
      return;
    }

    // Upload documents if provided
    if (documents && documents.length > 0) {
      await uploadEmployeeDocuments(newId, documents);
    }

    // Employee created successfully, now create auth user and send magic link
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${supabaseUrl}/functions/v1/create-employee-auth`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            full_name: data.fullName,
            employee_id: newId,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Employee created and invitation sent:', result.message);
      } else {
        console.warn('⚠️ Employee created but invitation failed:', result.error);
        console.warn('Employee can still login using magic link from the login page.');
      }
    } catch (inviteError: any) {
      console.error('Error sending invitation:', inviteError.message);
      console.warn('Employee was created but invitation email failed. They can request a magic link from the login page.');
    }

    fetchEmployees();
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

    
    // Then delete the employee
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (!error) {
      fetchEmployees();
    } else {
      console.error('Error deleting employee:', error.message);
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
      console.warn('Account not linked to an employee record');
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    
    // Check if already checked in
    const existingAtt = attendance[`${currentUser.employeeId}-${today}`];
    if (existingAtt?.checkIn) {
      console.warn('Already checked in today');
      return;
    }

    // Check for approved full-day leave
    const approvedFullDayLeave = leaves.find(l => 
      l.employeeId === currentUser.employeeId && 
      l.startDate === today && 
      l.status === 'Approved' &&
      l.type !== 'HALF_DAY' // Any leave type except half-day
    );

    if (approvedFullDayLeave) {
      // They have full day leave - should they be checking in?
      // Allow it but log warning (they might want to cancel leave)
      console.warn(`Note: You have approved ${approvedFullDayLeave.type} leave for today`);
    }

    const timeNow = new Date().toLocaleTimeString('en-US', {hour12: false});

    const payload = {
      employee_id: currentUser.employeeId,
      date: today,
      status: 'Present', // Initial status, will be updated on check-out
      check_in: timeNow
    };

    const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'employee_id,date' });
    if (!error) fetchAttendance();
    else console.error('Check-in failed:', error.message);
  };



  const getStatusFromDuration = (checkInStr: string, checkOutStr: string): 'Present' | 'Absent' | 'Half Day' => {
      const [inH, inM] = checkInStr.split(':').map(Number);
      const [outH, outM] = checkOutStr.split(':').map(Number);
      
      const start = inH * 60 + (inM || 0);
      const end = outH * 60 + (outM || 0);
      
      let durationMinutes = end - start;
      
      // Handle midnight crossing (next day checkout)
      if (durationMinutes < 0) {
        durationMinutes += 24 * 60; // Add 24 hours
      }
      
      const durationHours = durationMinutes / 60;

      // Configurable thresholds (can move to settings later)
      const HALF_DAY_MIN_HOURS = 4;
      const FULL_DAY_MIN_HOURS = 6;

      if (durationHours < HALF_DAY_MIN_HOURS) return 'Absent';
      if (durationHours >= HALF_DAY_MIN_HOURS && durationHours < FULL_DAY_MIN_HOURS) {
        return 'Half Day';
      }
      return 'Present';
  };

  const employeeCheckOut = async () => {
    if (!currentUser?.employeeId) return;
    const today = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString('en-US', {hour12: false});

    // Fetch the check-in time to calculate duration
    const { data: currentRecord } = await supabase
        .from('attendance')
        .select('check_in')
        .eq('employee_id', currentUser.employeeId)
        .eq('date', today)
        .single();
    
    if (!currentRecord?.check_in) {
      console.error('Cannot check out without check-in');
      return;
    }

    // Calculate work status based on hours worked
    const workStatus = getStatusFromDuration(currentRecord.check_in, timeNow);
    let finalStatus = workStatus; // Default: status = work only
    
    // Check for any approved leave for today
    const approvedLeave = leaves.find(l => 
        l.employeeId === currentUser.employeeId && 
        l.startDate === today && 
        l.status === 'Approved'
    );

    if (approvedLeave) {
      // Employee has approved leave for today
      
      if (approvedLeave.type === 'HALF_DAY') {
        // Half-day leave: combine leave credit (0.5) + work credit
        const session = approvedLeave.session;
        
        if (session === 'FIRST_HALF' || session === 'SECOND_HALF') {
          // They have 0.5 day leave credit
          
          if (workStatus === 'Half Day' || workStatus === 'Present') {
            // They worked 4+ hours (0.5 day work credit)
            // Total: 0.5 (leave) + 0.5 (work) = 1.0 day
            finalStatus = 'Present'; // ✅ Full day credit
          } else {
            // They worked < 4 hours (0 work credit)
            // Total: 0.5 (leave) + 0 (work) = 0.5 day
            finalStatus = 'Half Day'; // ✅ Half day from leave only
          }
        }
      } else {
        // Full day leave (CASUAL, SICK, etc.)
        // They shouldn't be working, but if they checked in:
        // Total credit capped at 1.0 day (can't exceed full day)
        finalStatus = 'Present'; // ✅ Full day credit from leave
      }
    }

    // Update attendance with final status (represents total daily credit)
    const { error } = await supabase
      .from('attendance')
      .update({ check_out: timeNow, status: finalStatus })
      .eq('employee_id', currentUser.employeeId)
      .eq('date', today);

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
      session: leaveData.session || 'FULL_DAY',
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
      console.error('Error processing payroll:', error.message);
    } else {
      fetchPayroll();
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
      <div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden">
          <div className="bg-white p-8 text-center">
            {/* Company Logo */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl p-4">
                <img 
                  src="/nppmt-logo.jpeg" 
                  alt="NPPMT Logo" 
                  className="w-30 h-20 object-contain"
                />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-black tracking-tight">{APP_NAME}</h1>
            <p className="text-black mt-2 text-sm">Secure Employee Management System</p>
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

  // Router Logic with Role Guards
  const renderContent = () => {
      // Defensive role checks - prevent unauthorized access
      const restrictedToHRAdmin = [ViewState.EMPLOYEES, ViewState.ATTENDANCE, ViewState.LEAVE, ViewState.PAYROLL, ViewState.REPORTS];
      const restrictedToAdmin = [ViewState.SETTINGS];

      // Check if employee is trying to access restricted views
      if (currentUser.role === UserRole.EMPLOYEE && restrictedToHRAdmin.includes(currentView)) {
        return (
          <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Access Denied</h3>
            <p className="text-slate-600">You don't have permission to view this page.</p>
            <button 
              onClick={() => setCurrentView(ViewState.DASHBOARD)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        );
      }

      // Check if HR is trying to access ADMIN-only views
      if (currentUser.role === UserRole.HR && restrictedToAdmin.includes(currentView)) {
        return (
          <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-orange-100">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Admin Access Required</h3>
            <p className="text-slate-600">This page is only accessible to administrators.</p>
            <button 
              onClick={() => setCurrentView(ViewState.DASHBOARD)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        );
      }

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
                  onViewAllEmployees={() => setCurrentView(ViewState.EMPLOYEES)}
                  onAddAnnouncement={addAnnouncement}
                  onDeleteAnnouncement={deleteAnnouncement}
                  employeeDocuments={employeeDocuments}
                  onGetDocumentUrl={getDocumentSignedUrl}
              />;
          case ViewState.EMPLOYEES:
              return <EmployeeList 
                  employees={employees} 
                  onAddEmployee={addEmployee}
                  onUpdateEmployee={updateEmployee}
                  onDeleteEmployee={deleteEmployee}
                  employeeDocuments={employeeDocuments}
                  onUploadDocuments={uploadEmployeeDocuments}
                  onDeleteDocument={deleteEmployeeDocument}
                  onGetDocumentUrl={getDocumentSignedUrl}
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