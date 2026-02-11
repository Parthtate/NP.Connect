import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RegularizationRequest, RegularizationStatus } from '../types';
import { CheckCircle, XCircle, Loader2, User, Calendar, Clock, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RegularizationWithEmployee extends RegularizationRequest {
  employee_name?: string;
  employee_email?: string;
  attendance_date?: string;
  check_in_time?: string;
}

const RegularizationApprovals: React.FC = () => {
  const [requests, setRequests] = useState<RegularizationWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<RegularizationStatus | 'ALL'>('PENDING');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [adminRemarks, setAdminRemarks] = useState<Record<string, string>>({});

  // Fetch regularization requests with employee details
  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('regularization_requests')
        .select(`
          *,
          requester:profiles!regularization_requests_requester_id_fkey(full_name, email),
          attendance_log:attendance_logs!regularization_requests_attendance_log_id_fkey(date, check_in)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'ALL') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching requests:', error);
      } else {
        // Transform the data to flatten nested objects
        const transformedData = (data || []).map((req: any) => ({
          ...req,
          employee_name: req.requester?.full_name || 'Unknown',
          employee_email: req.requester?.email || '',
          attendance_date: req.attendance_log?.date || '',
          check_in_time: req.attendance_log?.check_in || ''
        }));
        setRequests(transformedData);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  // Handle Approve
  const handleApprove = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const remarks = adminRemarks[requestId] || null;
      
      const { data, error } = await supabase.rpc('approve_regularization', {
        p_request_id: requestId,
        p_admin_remarks: remarks
      });

      if (error) {
        alert(`Error: ${error.message}`);
        return;
      }

      const response = data as { success: boolean, message: string };
      
      if (response.success) {
        alert('✅ Request approved successfully!');
        fetchRequests(); // Refresh list
      } else {
        alert(response.message);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Reject
  const handleReject = async (requestId: string) => {
    const remarks = adminRemarks[requestId];
    
    if (!remarks || remarks.trim() === '') {
      alert('Please provide admin remarks before rejecting');
      return;
    }

    setActionLoading(requestId);
    try {
      const { data, error } = await supabase.rpc('reject_regularization', {
        p_request_id: requestId,
        p_admin_remarks: remarks
      });

      if (error) {
        alert(`Error: ${error.message}`);
        return;
      }

      const response = data as { success: boolean, message: string };
      
      if (response.success) {
        alert('❌ Request rejected');
        fetchRequests(); // Refresh list
      } else {
        alert(response.message);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: RegularizationStatus) => {
    const configs = {
      [RegularizationStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
      [RegularizationStatus.APPROVED]: 'bg-green-100 text-green-700',
      [RegularizationStatus.REJECTED]: 'bg-red-100 text-red-700'
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Regularization Approvals</h2>
          <p className="text-slate-500">Review and approve employee attendance corrections</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No regularization requests found</p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {request.employee_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{request.employee_name}</h3>
                    <p className="text-sm text-slate-500">{request.employee_email}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {request.attendance_date && format(parseISO(request.attendance_date), 'MMM dd, yyyy')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Requested: {format(parseISO(request.created_at), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                  {request.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="text-xs text-slate-500 mb-1">Original Check-In</div>
                  <div className="text-lg font-semibold text-slate-900">
                    {request.check_in_time && format(parseISO(request.check_in_time), 'HH:mm:ss')}
                  </div>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-xs text-indigo-600 mb-1">Proposed Check-Out</div>
                  <div className="text-lg font-semibold text-indigo-900">
                    {format(parseISO(request.proposed_check_out), 'HH:mm:ss')}
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="text-xs font-semibold text-amber-800 mb-2">Employee Reason:</div>
                <p className="text-sm text-amber-900">{request.reason}</p>
              </div>

              {request.status === RegularizationStatus.PENDING && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Admin Remarks (Optional)
                    </label>
                    <textarea
                      value={adminRemarks[request.id] || ''}
                      onChange={(e) => setAdminRemarks({ ...adminRemarks, [request.id]: e.target.value })}
                      rows={2}
                      placeholder="Add any remarks or notes..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === request.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={actionLoading === request.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === request.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {request.status !== RegularizationStatus.PENDING && request.admin_remarks && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="text-xs font-semibold text-slate-600 mb-2">Admin Remarks:</div>
                  <p className="text-sm text-slate-700">{request.admin_remarks}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RegularizationApprovals;
