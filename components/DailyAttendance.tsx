import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AttendanceLog, AttendanceStatus, LeaveSession } from '../types';
import { Clock, Check, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DailyAttendanceProps {
  userId: string;
  employeeId: string;
}

const DailyAttendance: React.FC<DailyAttendanceProps> = ({ userId, employeeId }) => {
  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
  const [leaveSession, setLeaveSession] = useState<LeaveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance and leave
  const fetchTodayData = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Fetch attendance log
      const { data: attData, error: attError } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (attError && attError.code !== 'PGRST116') {
        console.error('Error fetching attendance:', attError);
      } else {
        setTodayLog(attData || null);
      }

      // Check for approved leave today
      const { data: leaveData, error: leaveError } = await supabase
        .from('leaves')
        .select('session')
        .eq('employee_id', employeeId)
        .eq('status', 'Approved')
        .lte('start_date', today)
        .gte('end_date', today)
        .single();

      if (!leaveError && leaveData) {
        setLeaveSession(leaveData.session as LeaveSession);
        if (leaveData.session === LeaveSession.FULL_DAY) {
          setMessage({ type: 'info', text: 'You have a full-day leave approved for today. No check-in required.' });
        }
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayData();
  }, [userId, employeeId]);

  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!todayLog?.check_in) return '00:00:00';
    
    const checkInTime = new Date(todayLog.check_in);
    const diff = currentTime.getTime() - checkInTime.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  // Handle Check-In
  const handleCheckIn = async () => {
    setActionLoading(true);
    setMessage(null);
    
    try {
      const { data, error } = await supabase.rpc('punch_in_v2');
      
      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }

      const response = data as { success: boolean, message: string, is_late?: boolean, auto_half_day?: boolean, leave_session?: LeaveSession };
      
      if (response.success) {
        setMessage({ type: 'success', text: response.message });
        await fetchTodayData();
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to check in' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Check-Out
  const handleCheckOut = async () => {
    setActionLoading(true);
    setMessage(null);
    
    try {
      const { data, error } = await supabase.rpc('punch_out_v2');
      
      if (error) {
        setMessage({ type: 'error', text: error.message });
        return;
      }

      const response = data as { success: boolean, message: string, status?: string, duration_hours?: number };
      
      if (response.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ Checked out! Status: ${response.status} (${response.duration_hours}h)` 
        });
        await fetchTodayData();
      } else {
        setMessage({ type: 'error', text: response.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to check out' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // If full-day leave, don't show check-in/out options
  if (leaveSession === LeaveSession.FULL_DAY) {
    return (
      <div className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-100 p-8">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">On Leave Today</h3>
          <p className="text-slate-600">You have a full-day leave approved. Enjoy your day!</p>
        </div>
      </div>
    );
  }

  const isCheckedIn = todayLog && !todayLog.check_out;
  const isCompleted = todayLog && todayLog.check_out;

  // Determine button text based on leave session
  const getCheckInButtonText = () => {
    if (leaveSession === LeaveSession.FIRST_HALF) {
      return 'Check In (Afternoon Shift)';
    }
    return 'Check In';
  };

  return (
    <div className="bg-linear-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg border border-indigo-100 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Today's Attendance</h3>
            <p className="text-sm text-slate-500">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
            {leaveSession && (
              <p className="text-xs text-indigo-600 font-medium mt-1">
                {leaveSession === LeaveSession.FIRST_HALF ? '🌅 First Half Leave' : '🌆 Second Half Leave'}
              </p>
            )}
          </div>
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <Clock className="w-6 h-6 text-indigo-600" />
          </div>
        </div>

        {/* Current Time */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="text-center">
            <div className="text-4xl font-bold text-slate-900 font-mono">
              {format(currentTime, 'HH:mm:ss')}
            </div>
            <div className="text-sm text-slate-500 mt-1">Current Time</div>
          </div>
        </div>

        {/* Timer (if checked in) */}
        {isCheckedIn && (
          <div className="bg-linear-to-r from-green-400 to-emerald-500 rounded-lg p-6 mb-6 shadow-md">
            <div className="text-center">
              <div className="text-sm font-medium text-white/80 mb-2">Hours Worked</div>
              <div className="text-5xl font-bold text-white font-mono tracking-wider">
                {getElapsedTime()}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm text-white/90">Recording...</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Display */}
        {todayLog && (
          <div className="bg-white rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Check-In:</span>
              <span className="text-sm font-semibold text-slate-900">
                {format(new Date(todayLog.check_in), 'HH:mm:ss')}
              </span>
            </div>
            {todayLog.check_out && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Check-Out:</span>
                <span className="text-sm font-semibold text-slate-900">
                  {format(new Date(todayLog.check_out), 'HH:mm:ss')}
                </span>
              </div>
            )}
            {todayLog.is_late && (
              <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Late Mark</span>
              </div>
            )}
            {isCompleted && (
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    todayLog.status === AttendanceStatus.PRESENT 
                      ? 'bg-green-100 text-green-700'
                      : todayLog.status === AttendanceStatus.HALF_DAY
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {todayLog.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-slate-600">Duration:</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {todayLog.work_duration_hours.toFixed(2)} hours
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {!todayLog && (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="w-full bg-linear-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {getCheckInButtonText()}
                </>
              )}
            </button>
          )}

          {isCheckedIn && (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="w-full bg-linear-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Check Out
                </>
              )}
            </button>
          )}

          {isCompleted && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
                <Check className="w-5 h-5" />
                <span className="font-medium">Attendance Completed for Today</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyAttendance;
