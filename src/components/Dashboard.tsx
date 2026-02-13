import React, { useEffect, useState, useMemo } from 'react';
import { User, UserRole, Employee, AttendanceRecord, LeaveRequest, Holiday } from '../../types';
import { Calendar, Clock, LogIn, LogOut, CheckCircle, Hourglass, User as UserIcon, TrendingUp, Award, Users, DollarSign, AlertCircle, Gift, ArrowRight, Trash2, Plus, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { formatDateLong } from '../utils/dateUtils';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
}

interface DashboardProps {
  user: User;
  employees: Employee[];
  attendance: Record<string, AttendanceRecord>;
  leaves: LeaveRequest[];
  holidays: Holiday[];
  announcements?: Announcement[]; // New Prop
  onCheckIn: () => void;
  onCheckOut: () => void;
  onViewAllEmployees?: () => void;
  onAddAnnouncement?: (announcement: Omit<Announcement, 'id'>) => void;
  onDeleteAnnouncement?: (id: string) => void;
  employeeDocuments?: Record<string, import('../../types').EmployeeDocument[]>; // New Prop
  onGetDocumentUrl?: (filePath: string) => Promise<string | null>; // New Prop
}

const Dashboard: React.FC<DashboardProps> = ({ user, employees, attendance, leaves, holidays, announcements = [], onCheckIn, onCheckOut, onViewAllEmployees, onAddAnnouncement, onDeleteAnnouncement, employeeDocuments = {}, onGetDocumentUrl }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Stats
  const today = new Date().toISOString().split('T')[0];
  const totalEmployees = employees.length;
  
  const todayAttendance = (Object.values(attendance) as AttendanceRecord[]).filter((a) => a.date === today);
  const presentCount = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day' || a.status === 'LEAVE' || a.status === 'HALF_DAY_LEAVE').length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

  // Employee specific
  const myEmployeeId = user.employeeId;
  const myTodayAtt = myEmployeeId ? attendance[`${myEmployeeId}-${today}`] : null;
  const myLeaves = leaves.filter(l => l.employeeId === myEmployeeId);
  
  // Calculate leave balance for employee
  const calculateLeaveBalance = () => {
    const annualLeaveQuota = 24; // Standard annual leave days
    const currentYear = new Date().getFullYear();
    
    // Filter approved leaves for current year
    const approvedLeaves = myLeaves.filter(l => 
      l.status === 'Approved' && 
      l.startDate.startsWith(currentYear.toString())
    );
    
    // Calculate total days used
    const usedDays = approvedLeaves.reduce((total, leave) => {
      // Check for half day
      if (leave.session && leave.session !== 'FULL_DAY') {
          return total + 0.5;
      }

      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return total + days;
    }, 0);
    
    return Math.max(0, annualLeaveQuota - usedDays); // Ensure non-negative
  };
  
  // Upcoming Holidays logic
  const upcomingHolidays = holidays
    .filter(h => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  // Render Employee Dashboard
  if (user.role === UserRole.EMPLOYEE) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Live Clock & Welcome */}
           <div className="lg:col-span-3 bg-linear-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-lg">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}</h1>
                <p className="text-slate-300">Have a productive day!</p>
              </div>
              <div className="mt-6 md:mt-0 text-right">
                <div className="text-5xl font-bold font-mono tracking-wider">
                  {time.toLocaleTimeString([], { hour12: false })}
                </div>
                <div className="text-slate-400 mt-1 font-medium">
                  {formatDateLong(time)}
                </div>
              </div>
           </div>

           {/* Attendance Actions */}
           <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Today's Attendance</h3>
              {!myTodayAtt || !myTodayAtt.checkIn ? (
                <button 
                  onClick={onCheckIn}
                  className="w-full flex flex-col items-center justify-center p-8 rounded-xl bg-linear-to-br from-green-500 to-green-600 text-white hover:shadow-lg hover:scale-[1.02] transition-all"
                >
                  <LogIn size={48} className="mb-4" />
                  <span className="text-xl font-bold">Check In</span>
                  <span className="text-green-100 text-sm mt-1">Start your day</span>
                </button>
              ) : (
                <div className="space-y-4">
                   <div className="flex items-center justify-between p-5 bg-green-50 border border-green-200 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-green-700">Checked In At</p>
                        <p className="text-3xl font-bold text-green-900">{myTodayAtt.checkIn}</p>
                      </div>
                      <CheckCircle className="text-green-500" size={40} />
                   </div>

                   {!myTodayAtt.checkOut ? (
                     <button 
                        onClick={onCheckOut}
                        className="w-full py-4 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                     >
                       <LogOut size={24} /> Check Out
                     </button>
                   ) : (
                    <>
                      <div className="flex items-center justify-between p-5 bg-orange-50 border border-orange-200 rounded-xl">
                        <div>
                          <p className="text-sm font-medium text-orange-700">Checked Out At</p>
                          <p className="text-3xl font-bold text-orange-900">{myTodayAtt.checkOut}</p>
                        </div>
                        <CheckCircle className="text-orange-500" size={40} />
                      </div>
                      
                      {/* Show calculated status */}
                      <div className={`p-4 rounded-xl text-center font-bold ${
                        myTodayAtt.status === 'Present' ? 'bg-green-100 text-green-800' :
                        myTodayAtt.status === 'Half Day' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Status: {myTodayAtt.status}
                      </div>
                    </>
                   )}
                </div>
              )}
           </div>

           {/* Stats Column */}
           <div className="space-y-6">
              <StatCard title="Leave Balance" value={`${calculateLeaveBalance()} Days`} icon={Calendar} color="bg-blue-500" />
              
              {/* Upcoming Holidays Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <Gift size={20} className="text-orange-500"/> Upcoming Holidays
                </h3>
                <div className="space-y-3">
                   {upcomingHolidays.map(h => (
                     <div key={h.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-3">
                           <div className="text-center bg-white p-1 rounded border border-orange-100 min-w-[40px]">
                              <div className="text-[10px] uppercase font-bold text-orange-500">{new Date(h.date).toLocaleString('default', { month: 'short' })}</div>
                              <div className="text-lg font-bold text-slate-700 leading-none">{new Date(h.date).getDate()}</div>
                           </div>
                           <p className="font-medium text-slate-900 text-sm">{h.name}</p>
                        </div>
                     </div>
                   ))}
                   {upcomingHolidays.length === 0 && <p className="text-slate-500 text-sm text-center">No upcoming holidays</p>}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Leaves</h3>
                <div className="space-y-3">
                   {myLeaves.slice(0, 3).map(l => (
                     <div key={l.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">{l.type}</p>
                          <p className="text-xs text-slate-500">{l.startDate}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${l.status === 'Approved' ? 'bg-green-100 text-green-700' : l.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>
                          {l.status}
                        </span>
                     </div>
                   ))}
                   {myLeaves.length === 0 && <p className="text-slate-500 text-sm text-center">No leave history</p>}
                </div>
               </div>
            </div>
         </div>

            {/* Announcements for Employee */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Gift size={20} className="text-purple-500"/> Announcements
               </h3>
               <div className="space-y-3 max-h-[200px] overflow-y-auto">
                  {announcements.map((a: Announcement) => (
                    <div key={a.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                       <h4 className="font-bold text-slate-800 text-sm">{a.title}</h4>
                       <p className="text-xs text-slate-600 mt-1">{a.content}</p>
                       <p className="text-[10px] text-slate-400 mt-2 text-right">{a.date}</p>
                    </div>
                  ))}
                  {announcements.length === 0 && <p className="text-slate-500 text-sm text-center">No announcements</p>}
               </div>
               </div>


            {/* My Documents Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
               <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-blue-500"/> My Documents
               </h3>
               <div className="space-y-3">
                  {myEmployeeId && employeeDocuments[myEmployeeId]?.map(doc => (
                    <div key={doc.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                       <div className="flex items-center gap-3 overflow-hidden">
                          <FileText size={16} className="text-slate-400 shrink-0" />
                          <div>
                            <p className="font-medium text-slate-900 text-sm truncate max-w-[150px]">{doc.fileName}</p>
                            <p className="text-[10px] text-slate-500">{doc.documentType.replace('_', ' ').toUpperCase()}</p>
                          </div>
                       </div>
                       <button 
                         onClick={async () => {
                           if (onGetDocumentUrl) {
                             const url = await onGetDocumentUrl(doc.filePath);
                             if (url) window.open(url, '_blank');
                           }
                         }}
                         className="text-blue-600 hover:text-blue-800 text-xs font-semibold"
                       >
                         View
                       </button>
                    </div>
                  ))}
                  {(!myEmployeeId || !employeeDocuments[myEmployeeId] || employeeDocuments[myEmployeeId].length === 0) && (
                    <p className="text-slate-500 text-sm text-center">No documents uploaded</p>
                  )}
               </div>
            </div>
      </div>
    );
  }

  // HR / Admin Dashboard
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{user.role === UserRole.ADMIN ? 'Admin Dashboard' : 'HR Dashboard'}</h2>
          <p className="text-slate-500 mt-1">Overview of company workforce</p>
        </div>
        <div className="mt-4 md:mt-0 px-4 py-2 bg-white rounded-lg border shadow-sm flex items-center space-x-2">
          <Calendar className="text-blue-600" size={20} />
          <span className="font-medium text-slate-700">{formatDateLong(time)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Employees" value={totalEmployees.toString()} icon={Users} color="bg-blue-500" />
        <StatCard title="Present Today" value={presentCount.toString()} icon={Clock} color="bg-green-500" />
        <StatCard title="Pending Leaves" value={pendingLeaves.toString()} icon={AlertCircle} color="bg-orange-500" />
        <StatCard title="Payroll Processed" value="0" icon={DollarSign} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Department Distribution */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Department Distribution</h3>
              <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100">Live Stats</div>
            </div>
            <div className="space-y-5">
               {Object.entries(employees.reduce((acc, emp) => {
                 acc[emp.department] = (acc[emp.department] || 0) + 1;
                 return acc;
               }, {} as Record<string, number>)).map(([dept, count]: [string, number]) => (
                 <div key={dept}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">{dept}</span>
                      <span className="text-sm font-bold text-slate-900">{count} Employees</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(count / totalEmployees) * 100}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>
         </div>

         {/* Recent Employees */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Recent Employees</h3>
              <button 
                onClick={onViewAllEmployees}
                className="text-sm text-blue-600 font-medium hover:text-blue-700 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight size={14} />
              </button>
            </div>
            <div className="space-y-3 flex-1">
              {employees.slice(0, 5).map(emp => (
                <div key={emp.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
                        {emp.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{emp.fullName}</p>
                        <p className="text-xs text-slate-500 font-medium">{emp.designation}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="text-xs font-mono text-slate-400 block">{emp.id}</span>
                      <span className="text-[10px] text-slate-400 block">{emp.department}</span>
                   </div>
                </div>
              ))}
            </div>
         </div>

         {/* Announcements Card (HR) */}
         <AnnouncementsCard 
            announcements={announcements} 
            role={user.role} 
            onAdd={onAddAnnouncement} 
            onDelete={onDeleteAnnouncement} 
         />
      </div>
    </div>
  );
};

const AnnouncementsCard = ({ announcements, role, onAdd, onDelete }: any) => {
  const [isAdding, setIsAdding] = React.useState(false);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (onAdd) {
      onAdd({
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        date: new Date().toISOString().split('T')[0]
      });
    }
    setIsAdding(false);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
         <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Gift size={20} className="text-purple-500"/> Announcements
         </h3>
         {role !== 'EMPLOYEE' && (
           <button 
             onClick={() => setIsAdding(!isAdding)}
             className="text-sm text-purple-600 font-medium hover:text-purple-700 hover:underline flex items-center gap-1"
           >
             {isAdding ? 'Cancel' : <><Plus size={16} /> Add New</>}
           </button>
         )}
       </div>
       
       {isAdding && (
         <form onSubmit={handleSubmit} className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <input name="title" required placeholder="Title" className="w-full mb-2 p-2 rounded border border-slate-300 text-sm" />
            <textarea name="content" required placeholder="Message" className="w-full mb-2 p-2 rounded border border-slate-300 text-sm" rows={2} />
            <button type="submit" className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-bold">Post Announcement</button>
         </form>
       )}

       <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px]">
          {announcements.map((a: any) => (
            <div key={a.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
               <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 text-sm">{a.title}</h4>
                  {role !== 'EMPLOYEE' && onDelete && (
                    <button onClick={() => onDelete(a.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                  )}
               </div>
               <p className="text-xs text-slate-600 mt-1">{a.content}</p>
               <p className="text-[10px] text-slate-400 mt-2 text-right">{a.date}</p>
            </div>
          ))}
          {announcements.length === 0 && <p className="text-slate-500 text-sm text-center py-4">No announcements</p>}
       </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }: any) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`p-5 rounded-2xl ${color}/10`}>
        <Icon size={32} className={color.replace('bg-', 'text-')} strokeWidth={2.5} />
      </div>
    </div>
  );
};

export default Dashboard;