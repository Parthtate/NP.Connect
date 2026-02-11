import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AttendanceLog, AttendanceStatus, RegularizationRequest } from '../types';
import { Calendar, AlertCircle, Send, X, Loader2, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AttendanceHistoryProps {
  userId: string;
}

const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({ userId }) => {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegularizeModal, setShowRegularizeModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [regularizeForm, setRegularizeForm] = useState({
    proposed_check_out: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch attendance logs
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30);

      if (error) {
        console.error('Error fetching logs:', error);
      } else {
        setLogs(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  // Handle Regularize Modal
  const handleOpenRegularize = (log: AttendanceLog) => {
    setSelectedLog(log);
    setRegularizeForm({
      proposed_check_out: '',
      reason: ''
    });
    setMessage(null);
    setShowRegularizeModal(true);
  };

  const handleCloseRegularize = () => {
    setShowRegularizeModal(false);
    setSelectedLog(null);
    setRegularizeForm({ proposed_check_out: '', reason: '' });
    setMessage(null);
  };

  // Submit Regularization Request
  const handleSubmitRegularization = async () => {
    if (!selectedLog) return;

    if (!regularizeForm.proposed_check_out || !regularizeForm.reason) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      // Construct the proposed check-out datetime
      const proposedDateTime = `${selectedLog.date}T${regularizeForm.proposed_check_out}:00`;

      const { data, error } = await supabase.rpc('submit_regularization_request', {
        p_attendance_log_id: selectedLog.id,
        p_proposed_check_out: proposedDateTime,
        p_reason: regularizeForm.reason
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }

      const response = data as { success: boolean, message: string };

      if (response.success) {
        setMessage({ type: 'success', text: 'Regularization request submitted successfully!' });
        setTimeout(() => {
          handleCloseRegularize();
          fetchLogs(); // Refresh logs
        }, 1500);
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit request' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    const configs = {
      [AttendanceStatus.PRESENT]: 'bg-green-100 text-green-700',
      [AttendanceStatus.HALF_DAY]: 'bg-yellow-100 text-yellow-700',
      [AttendanceStatus.ABSENT]: 'bg-red-100 text-red-700',
      [AttendanceStatus.MISSING_SWIPE]: 'bg-orange-100 text-orange-700'
    };
    return configs[status] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Attendance History</h3>
            <p className="text-sm text-slate-500">Last 30 days attendance records</p>
          </div>
          <Calendar className="w-6 h-6 text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Check-In</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Check-Out</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Duration</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => {
                const isPastDate = new Date(log.date) < new Date(new Date().toISOString().split('T')[0]);
                const needsRegularization = log.status === AttendanceStatus.MISSING_SWIPE && isPastDate;

                return (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-4 text-sm text-slate-900 font-medium">
                      {format(parseISO(log.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        {format(parseISO(log.check_in), 'HH:mm:ss')}
                        {log.is_late && (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Late
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {log.check_out ? format(parseISO(log.check_out), 'HH:mm:ss') : '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {log.work_duration_minutes > 0 
                        ? `${(log.work_duration_minutes / 60).toFixed(2)}h` 
                        : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(log.status)}`}>
                        {log.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      {needsRegularization && (
                        <button
                          onClick={() => handleOpenRegularize(log)}
                          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          <FileText className="w-4 h-4" />
                          Regularize
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regularization Modal */}
      {showRegularizeModal && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Regularization Request</h3>
              <button
                onClick={handleCloseRegularize}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="text-sm text-slate-600 mb-1">Date</div>
                <div className="text-base font-semibold text-slate-900">
                  {format(parseISO(selectedLog.date), 'MMMM dd, yyyy')}
                </div>
                <div className="text-sm text-slate-600 mt-2">
                  Check-In: <span className="font-medium text-slate-900">
                    {format(parseISO(selectedLog.check_in), 'HH:mm:ss')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Proposed Check-Out Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={regularizeForm.proposed_check_out}
                  onChange={(e) => setRegularizeForm({ ...regularizeForm, proposed_check_out: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={regularizeForm.reason}
                  onChange={(e) => setRegularizeForm({ ...regularizeForm, reason: e.target.value })}
                  rows={4}
                  placeholder="Please explain why you need to regularize this attendance..."
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              {message && (
                <div className={`p-3 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3">
              <button
                onClick={handleCloseRegularize}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRegularization}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendanceHistory;
