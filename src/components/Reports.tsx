import React, { useState } from 'react';
import { CalendarCheck, Umbrella, DollarSign, Users, ChevronLeft, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Employee, AttendanceRecord, LeaveRequest, PayrollRecord } from '../../types';

interface ReportsProps {
  employees: Employee[];
  attendance: Record<string, AttendanceRecord>;
  leaves: LeaveRequest[];
  payroll: Record<string, PayrollRecord>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports: React.FC<ReportsProps> = ({ employees, attendance, leaves, payroll }) => {
  const [activeReport, setActiveReport] = useState<'attendance' | 'leave' | 'payroll' | 'employee' | null>(null);

  // --- DATA PREPARATION ---

  // Attendance Data: Present counts per day (last 7 days for demo)
  const getAttendanceData = () => {
    const today = new Date();
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const records = (Object.values(attendance) as AttendanceRecord[]).filter((a) => a.date === dateStr);
      const present = records.filter(a => a.status === 'Present').length;
      const halfDay = records.filter(a => a.status === 'Half Day').length;
      const absent = records.filter(a => a.status === 'Absent').length;
      
      data.push({
        date: d.toLocaleDateString('en-US', { weekday: 'short' }),
        Present: present,
        'Half Day': halfDay,
        Absent: absent
      });
    }
    return data;
  };

  // Leave Data: Distribution by Type
  const getLeaveData = () => {
    const counts: Record<string, number> = {};
    leaves.forEach(l => {
      counts[l.type] = (counts[l.type] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  };

  // Payroll Data: Monthly Trends (Mocked slightly based on available data)
  const getPayrollData = () => {
    const monthlyTotals: Record<string, number> = {};
    (Object.values(payroll) as PayrollRecord[]).forEach((p) => {
        monthlyTotals[p.month] = (monthlyTotals[p.month] || 0) + p.net;
    });
    return Object.entries(monthlyTotals)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const renderContent = () => {
    if (!activeReport) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <ReportCard 
             title="Attendance Reports" 
             icon={CalendarCheck} 
             color="text-green-600 bg-green-50"
             description="View daily attendance trends and presence analytics."
             onClick={() => setActiveReport('attendance')}
           />
           <ReportCard 
             title="Leave Reports" 
             icon={Umbrella} 
             color="text-blue-600 bg-blue-50"
             description="Analyze leave distribution and employee absence reasons."
             onClick={() => setActiveReport('leave')}
           />
           <ReportCard 
             title="Payroll Reports" 
             icon={DollarSign} 
             color="text-purple-600 bg-purple-50"
             description="Track salary payouts and financial trends over time."
             onClick={() => setActiveReport('payroll')}
           />
           <ReportCard 
             title="Employee Master" 
             icon={Users} 
             color="text-orange-600 bg-orange-50"
             description="View total employee counts and department breakdown."
             onClick={() => setActiveReport('employee')}
           />
        </div>
      );
    }

    // Detail Views
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setActiveReport(null)}
          className="flex items-center text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft size={20} /> <span className="font-medium ml-1">Back to Reports</span>
        </button>

        {activeReport === 'attendance' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-6">Weekly Attendance Overview</h3>
             <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getAttendanceData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Present" stackId="a" fill="#22c55e" />
                    <Bar dataKey="Half Day" stackId="a" fill="#eab308" />
                    <Bar dataKey="Absent" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="mt-6 text-sm text-slate-500 text-center">
                Displaying attendance data for the last 7 days.
             </div>
          </div>
        )}

        {activeReport === 'leave' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-6">Leave Distribution by Type</h3>
             <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getLeaveData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getLeaveData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>
        )}

        {activeReport === 'payroll' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-6">Monthly Salary Payout Trends</h3>
             <div className="h-[400px] w-full">
                {getPayrollData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getPayrollData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => `₹${value}`} />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={3} activeDot={{ r: 8 }} name="Total Payout" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    No payroll data available yet. Process payroll to see charts.
                  </div>
                )}
             </div>
          </div>
        )}

        {activeReport === 'employee' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Employee Master List</h3>
                <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{employees.length} Records</span>
             </div>
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                   <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Designation</th>
                      <th className="p-4">Email</th>
                      <th className="p-4 text-right">Join Date</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {employees.map(emp => (
                     <tr key={emp.id} className="hover:bg-slate-50">
                        <td className="p-4 font-medium text-slate-900">{emp.fullName}</td>
                        <td className="p-4">{emp.department}</td>
                        <td className="p-4">{emp.designation}</td>
                        <td className="p-4 text-slate-600">{emp.email}</td>
                        <td className="p-4 text-right">{new Date(emp.dateOfJoining).toLocaleDateString()}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Reports & Analytics</h2>
        <p className="text-slate-500">Generate and visualize system reports</p>
      </div>
      {renderContent()}
    </div>
  );
};

const ReportCard = ({ title, icon: Icon, color, description, onClick }: any) => (
  <div 
    onClick={onClick}
    className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all group"
  >
     <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
           <Icon size={24} />
        </div>
        <div className="p-2 bg-slate-50 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
           <ChevronLeft size={20} className="rotate-180" />
        </div>
     </div>
     <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
     <p className="text-sm text-slate-500">{description}</p>
  </div>
);

export default Reports;