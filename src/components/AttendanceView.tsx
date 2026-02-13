import React from 'react';
import { AttendanceRecord, Employee, UserRole } from '../../types';
import { Check, Clock, User as UserIcon, X, Download, Calendar, FileText } from 'lucide-react';
import { formatDateForCSV } from '../utils/dateUtils';

interface AttendanceViewProps {
  role: UserRole;
  employees: Employee[];
  attendance: Record<string, AttendanceRecord>;
  currentEmployeeId?: string;
  onMarkAttendance: (employeeId: string, date: string, status: 'Present' | 'Absent' | 'Half Day') => void;
}

const AttendanceView: React.FC<AttendanceViewProps> = ({ role, employees, attendance, currentEmployeeId, onMarkAttendance }) => {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.substring(0, 7);
  const [selectedMonth, setSelectedMonth] = React.useState(currentMonth); // YYYY-MM
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);

  const getTodayAttendance = (empId: string) => {
    return attendance[`${empId}-${today}`];
  };

  // Filter attendance by selected month
  // Filter attendance by valid month (current month for summary, selected for modal)
  const currentMonthAttendance = React.useMemo(() => {
    return (Object.values(attendance) as AttendanceRecord[]).filter(att => att.date.startsWith(currentMonth));
  }, [attendance, currentMonth]);

  const filteredAttendance = React.useMemo(() => {
    return (Object.values(attendance) as AttendanceRecord[]).filter(att => att.date.startsWith(selectedMonth));
  }, [attendance, selectedMonth]);

  const calculateSummary = (empId: string) => {
    let present = 0, absent = 0, halfDay = 0;
    // Use currentMonthAttendance for the main summary view
    currentMonthAttendance.forEach((att) => {
      if (att.employeeId === empId) {
        if (att.status === 'Present' || att.status === 'LEAVE') present++;
        else if (att.status === 'Half Day' || att.status === 'HALF_DAY_LEAVE') halfDay++;
        else absent++;
      }
    });
    const total = present + absent + halfDay;
    return { present, absent, halfDay, total };
  };

  const exportToCSV = (month: string) => {
    // Filter by the requested month (either current or selected)
    const recordsToExport = (Object.values(attendance) as AttendanceRecord[]).filter(att => att.date.startsWith(month));
    
    const headers = ['Employee ID', 'Name', 'Date', 'Status', 'Check In', 'Check Out'];
    
    const escapeCsvField = (field: string | number | null | undefined) => {
        if (field === null || field === undefined) return '';
        const stringValue = String(field);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    const rows = recordsToExport.map(record => {
      const emp = employees.find(e => e.id === record.employeeId);
      return [
        escapeCsvField(record.employeeId),
        escapeCsvField(emp?.fullName || 'Unknown'),
        escapeCsvField(formatDateForCSV(record.date)), 
        escapeCsvField(record.status),
        escapeCsvField(record.checkIn || ''),
        escapeCsvField(record.checkOut || '')
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_${month}_${formatDateForCSV(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EMPLOYEE VIEW - View Only, No Mark Attendance
  if (role === UserRole.EMPLOYEE) {
    if (!currentEmployeeId) {
      return (
        <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-100">
           <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
           <h3 className="text-lg font-medium text-slate-900">Profile Not Linked</h3>
           <p className="text-slate-500">Your account is not linked to an employee record yet. Please contact HR.</p>
        </div>
      );
    }

    const summary = calculateSummary(currentEmployeeId);
    const percentage = summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(1) : '0.0';
    const history = (Object.values(attendance) as AttendanceRecord[])
      .filter((a) => a.employeeId === currentEmployeeId)
      .sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Attendance</h2>
          <p className="text-slate-500">View your attendance record</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Days Present</p>
                <p className="text-3xl font-bold text-slate-900">{summary.present}</p>
              </div>
              <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                <Check size={24} />
              </div>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Half Days</p>
                <p className="text-3xl font-bold text-slate-900">{summary.halfDay}</p>
              </div>
              <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg">
                <Clock size={24} />
              </div>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Attendance Rate</p>
                <p className="text-3xl font-bold text-slate-900">{percentage}%</p>
              </div>
              <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                <Calendar size={24} />
              </div>
           </div>
        </div>

        {/* History Table - View Only */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
             <h3 className="text-lg font-semibold text-slate-800">Attendance History</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Check In</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Check Out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map(att => (
                <tr key={`${att.employeeId}-${att.date}`}>
                  <td className="p-4 text-sm text-slate-700">{att.date}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${att.status === 'Present' ? 'bg-green-100 text-green-800' : 
                        att.status === 'Half Day' ? 'bg-yellow-100 text-yellow-800' : 
                        att.status === 'LEAVE' ? 'bg-blue-100 text-blue-800' :
                        att.status === 'HALF_DAY_LEAVE' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'}`}>
                      {att.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{att.checkIn || '-'}</td>
                  <td className="p-4 text-sm text-slate-600">{att.checkOut || '-'}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={4} className="p-6 text-center text-slate-500">No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // HR VIEW
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Attendance Management</h2>
        <p className="text-slate-500">Mark and manage employee attendance</p>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800">Today's Attendance - View Only ({today})</h3>
            <p className="text-sm text-slate-500 mt-1">Employees manage their own attendance from the dashboard</p>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {employees.map(emp => {
              const att = getTodayAttendance(emp.id);
              return (
                <div key={emp.id} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50">
                  <div className="flex items-center space-x-3 w-full sm:w-auto">
                    <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {emp.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{emp.fullName}</div>
                      <div className="text-xs text-slate-500">{emp.id} • {emp.designation}</div>
                    </div>
                 </div>
                  {/* Read-only status display */}
                  <div className="flex items-center gap-3">
                    {att ? (
                      <>
                        <span className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2
                          ${att.status === 'Present' ? 'bg-green-100 text-green-700' : 
                            att.status === 'Half Day' ? 'bg-yellow-100 text-yellow-700' : 
                            att.status === 'LEAVE' ? 'bg-blue-100 text-blue-700' :
                            att.status === 'HALF_DAY_LEAVE' ? 'bg-purple-100 text-purple-700' :
                            'bg-red-100 text-red-700'}`}>
                          {att.status === 'Present' && <Check size={16} />}
                          {att.status === 'Half Day' && <Clock size={16} />}
                          {(att.status === 'LEAVE' || att.status === 'HALF_DAY_LEAVE') && <Calendar size={16} />}
                          {att.status === 'Absent' && <X size={16} />}
                          {att.status.replace('_', ' ')}
                        </span>
                        {att.checkIn && (
                          <span className="text-xs text-slate-500">
                            In: {att.checkIn} {att.checkOut && `• Out: ${att.checkOut}`}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-500">
                        Not Marked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Export Widget & History Toggle */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit space-y-6">
          
          {/* Export Current Month */}
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Export Data</h3>
            <p className="text-sm text-slate-500 mb-4">Download attendance for <strong>Current Month</strong></p>
            
            <div className="border border-slate-200 rounded-xl p-6 bg-slate-50">
               <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                   <FileText size={24} />
                 </div>
                 <div>
                   <div className="font-semibold text-slate-800">CSV Export</div>
                   <div className="text-xs text-slate-500">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                 </div>
               </div>
               <button 
                  onClick={() => exportToCSV(currentMonth)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
               >
                  <Download size={18} /> Download CSV
               </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
             <h3 className="text-lg font-semibold text-slate-800 mb-2">History</h3>
             <p className="text-sm text-slate-500 mb-4">View and export past attendance records</p>
             <button 
                onClick={() => setShowHistoryModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 py-2.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium"
             >
                <Calendar size={18} /> View Detailed History
             </button>
          </div>

        </div>
      </div>

      {/* Monthly Summary (Current Month) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
           <h3 className="text-lg font-semibold text-slate-800">Monthly Summary ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
               <tr>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Present</th>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Half Day</th>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Absent</th>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Total Days</th>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Att. %</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map(emp => {
                const summary = calculateSummary(emp.id);
                const percentage = summary.total > 0 ? ((summary.present / summary.total) * 100).toFixed(1) : '0';
                return (
                  <tr key={emp.id}>
                    <td className="p-4">
                       <div className="flex items-center space-x-3">
                         <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 text-xs font-bold">
                            {emp.fullName.split(' ').map(n => n[0]).join('')}
                         </div>
                         <div className="font-medium text-slate-900">{emp.fullName}</div>
                       </div>
                    </td>
                    <td className="p-4"><span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">{summary.present}</span></td>
                    <td className="p-4"><span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-semibold">{summary.halfDay}</span></td>
                    <td className="p-4"><span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">{summary.absent}</span></td>
                    <td className="p-4 font-semibold text-slate-700">{summary.total}</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>



      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <div>
                    <h3 className="text-xl font-bold text-slate-800">Attendance History</h3>
                    <p className="text-sm text-slate-500">View and export past records</p>
                 </div>
                 <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <X size={24} className="text-slate-500" />
                 </button>
              </div>
              
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700">Select Month:</span>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)} 
                        className="p-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button 
                      onClick={() => exportToCSV(selectedMonth)}
                      className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm"
                  >
                      <Download size={16} /> Export {selectedMonth} CSV
                  </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Employee</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Times</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAttendance.sort((a, b) => b.date.localeCompare(a.date)).map(att => {
                            const emp = employees.find(e => e.id === att.employeeId);
                            return (
                                <tr key={`${att.employeeId}-${att.date}`} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{att.date}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{emp?.fullName || att.employeeId}</div>
                                        <div className="text-xs text-slate-500">{emp?.designation}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                         <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                          ${att.status === 'Present' ? 'bg-green-100 text-green-800' : 
                                            att.status === 'Half Day' ? 'bg-yellow-100 text-yellow-800' : 
                                            att.status === 'LEAVE' ? 'bg-blue-100 text-blue-800' :
                                            att.status === 'HALF_DAY_LEAVE' ? 'bg-purple-100 text-purple-800' :
                                            'bg-red-100 text-red-800'}`}>
                                          {att.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap">
                                        {att.checkIn ? `${att.checkIn} - ${att.checkOut || '?'}` : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredAttendance.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-500">No records found for this month</td></tr>
                        )}
                    </tbody>
                </table>
              </div>
              
              <div className="p-6 border-t border-slate-100 flex justify-end">
                 <button 
                    onClick={() => setShowHistoryModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                 >
                    Close
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceView;