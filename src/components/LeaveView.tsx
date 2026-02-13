import React, { useState } from 'react';
import { LeaveRequest, UserRole, Employee, AttendanceRecord } from '../../types';
import { Plus, CheckCircle, Clock, XCircle, Check, X, Calendar, UserCheck } from 'lucide-react';
import Modal from './Modal';

interface LeaveViewProps {
  role: UserRole;
  leaves: LeaveRequest[];
  employees: Employee[]; // needed for HR to show names
  currentEmployeeId?: string;
  attendance?: Record<string, AttendanceRecord>;
  onApplyLeave: (leave: Omit<LeaveRequest, 'id' | 'status' | 'requestedOn'>) => void;
  onUpdateStatus: (id: string, status: 'Approved' | 'Rejected') => void;
}

const LeaveView: React.FC<LeaveViewProps> = ({ role, leaves, employees, attendance = {}, currentEmployeeId, onApplyLeave, onUpdateStatus }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const checkAvailability = (date: string) => {
    if (!currentEmployeeId || !date) return;
    
    // Check existing leaves
    const existingLeave = leaves.find(l => 
        l.employeeId === currentEmployeeId && 
        l.status !== 'Rejected' && // Ignore rejected
        ((date >= l.startDate && date <= l.endDate))
    );

    if (existingLeave) {
        setValidationError(`You have already applied for ${existingLeave.type.replace('_', ' ')} on this date.`);
        return;
    }

    // Check attendance (if already marked present/leave)
    const att = attendance[`${currentEmployeeId}-${date}`];
    if (att) {
        if (att.status === 'Present' || att.status === 'LEAVE') {
             setValidationError('Attendance/Leave is already marked for this date.');
             return;
        }
        if (att.status === 'Half Day' || att.status === 'HALF_DAY_LEAVE') {
             // If already half day, we technically could allow another half day, but user requested strict hiding
             setValidationError('Half-day attendance/leave already marked for this date.');
             return; 
        }
    }
    
    setValidationError('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLeaveType('');
    setStartDate('');
    setValidationError('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const type = formData.get('leaveType') as string;
    const session = formData.get('session') as 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF' || 'FULL_DAY';
    
    // Auto-set end date if half-day
    let endDate = formData.get('endDate') as string;
    // const startDate = formData.get('startDate') as string; // Use state instead
    if (session !== 'FULL_DAY') {
        endDate = startDate;
    }
    
    if (validationError) return; // Block submit if error

    onApplyLeave({
      employeeId: currentEmployeeId!, 
      type,
      startDate,
      endDate,
      reason: formData.get('reason') as string,
      session
    });
    closeModal();
  };

  // Filter leaves based on role
  // HR and ADMIN see all leaves, EMPLOYEE sees only their own
  const displayedLeaves = (role === UserRole.HR || role === UserRole.ADMIN)
    ? leaves 
    : leaves.filter(l => l.employeeId === currentEmployeeId);

  const pendingCount = displayedLeaves.filter(l => l.status === 'Pending').length;
  const approvedCount = displayedLeaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = displayedLeaves.filter(l => l.status === 'Rejected').length;
  if (role === UserRole.EMPLOYEE && !currentEmployeeId) {
     return (
        <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-100">
           <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
           <h3 className="text-lg font-medium text-slate-900">Profile Not Linked</h3>
           <p className="text-slate-500">Your account is not linked to an employee record yet. Please contact HR.</p>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {(role === UserRole.HR || role === UserRole.ADMIN) ? 'Leave Management' : 'My Leave Applications'}
          </h2>
          <p className="text-slate-500">Manage leave requests and status</p>
        </div>
        {role === UserRole.EMPLOYEE && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Apply for Leave</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
             <p className="text-sm text-slate-500 mb-1">Pending</p>
             <p className="text-3xl font-bold text-slate-900">{pendingCount}</p>
          </div>
          <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><Clock size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
             <p className="text-sm text-slate-500 mb-1">Approved</p>
             <p className="text-3xl font-bold text-slate-900">{approvedCount}</p>
          </div>
          <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle size={24}/></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
             <p className="text-sm text-slate-500 mb-1">Rejected</p>
             <p className="text-3xl font-bold text-slate-900">{rejectedCount}</p>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-lg"><XCircle size={24}/></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {(role === UserRole.HR || role === UserRole.ADMIN) && <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Employee</th>}
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Type</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Duration</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Reason</th>
              <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              {role === UserRole.HR && <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedLeaves.map(leave => {
              const emp = employees.find(e => e.id === leave.employeeId);
              return (
                <tr key={leave.id}>
                  {(role === UserRole.HR || role === UserRole.ADMIN) && (
                    <td className="p-4">
                      <div className="font-medium text-slate-900">{emp?.fullName || leave.employeeId}</div>
                      <div className="text-xs text-slate-500">{leave.employeeId}</div>
                    </td>
                  )}
                  <td className="p-4">
                    <div className="flex flex-col">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-xs font-medium w-fit mb-1">{leave.type}</span>
                        {leave.session && leave.session !== 'FULL_DAY' && (
                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                                {leave.session.replace('_', ' ')}
                            </span>
                        )}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-slate-600">{leave.startDate} {leave.endDate !== leave.startDate ? `to ${leave.endDate}` : ''}</td>
                  <td className="p-4 text-sm text-slate-600">{leave.reason}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${leave.status === 'Approved' ? 'bg-green-100 text-green-800' : 
                          leave.status === 'Pending' ? 'bg-orange-100 text-orange-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {leave.status}
                    </span>
                  </td>
                  {role === UserRole.HR && (
                    <td className="p-4">
                      {leave.status === 'Pending' && (
                        <div className="flex gap-2">
                           <button onClick={() => onUpdateStatus(leave.id, 'Approved')} className="p-1 bg-green-100 text-green-600 rounded hover:bg-green-200"><Check size={16}/></button>
                           <button onClick={() => onUpdateStatus(leave.id, 'Rejected')} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><X size={16}/></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {displayedLeaves.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">No leave requests found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Apply Modal - High Contrast UI */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title="Apply for Leave">
         <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Leave Type *</label>
              <select 
                  name="leaveType" 
                  required 
                  className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onChange={(e) => setSelectedLeaveType(e.target.value)}
              >
                <option value="">Select Type</option>
                <option value="CL">Casual Leave (CL)</option>
                <option value="SL">Sick Leave (SL)</option>
                <option value="PL">Privilege Leave (PL)</option>
                <option value="HALF_DAY">Half Day</option>
              </select>
            </div>

            {/* Session Selection for Half Day */}
            {selectedLeaveType === 'HALF_DAY' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Session *</label>
                  <select name="session" required className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="FIRST_HALF">First Half (Late In allowed till 2:15 PM)</option>
                    <option value="SECOND_HALF">Second Half (Early Out allowed from 2:00 PM)</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                      First Half: Work starts at 2:00 PM. <br/>
                      Second Half: Work ends at 2:00 PM.
                  </p>
                </div>
            )}
            <div className="grid grid-cols-2 gap-5">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Start Date *</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    required 
                    value={startDate}
                    onChange={(e) => {
                        setStartDate(e.target.value);
                        checkAvailability(e.target.value);
                    }}
                    className={`w-full p-2.5 border rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${validationError ? 'border-red-500 focus:ring-red-200' : 'border-slate-300'}`} 
                  />
                  {validationError && <p className="text-xs text-red-600 mt-1 font-medium">{validationError}</p>}
               </div>
               {selectedLeaveType !== 'HALF_DAY' && (
                   <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">End Date *</label>
                      <input type="date" name="endDate" required className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                   </div>
               )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Reason *</label>
              <textarea 
                name="reason" 
                rows={3} 
                required 
                className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-slate-400"
                placeholder="Describe the reason for leave..."
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100">
              <button type="button" onClick={closeModal} className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={!!validationError} className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Submit Application</button>
            </div>
         </form>
      </Modal>
    </div>
  );
};

export default LeaveView;