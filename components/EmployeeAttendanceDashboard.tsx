import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AttendanceSummary } from '../types';
import DailyAttendance from './DailyAttendance';
import AttendanceHistory from './AttendanceHistory';
import { TrendingUp, Calendar, Clock, Award, Loader2 } from 'lucide-react';

interface EmployeeAttendanceDashboardProps {
  userId: string;
}

const EmployeeAttendanceDashboard: React.FC<EmployeeAttendanceDashboardProps> = ({ userId }) => {
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch attendance summary
  const fetchSummary = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase.rpc('get_my_attendance_summary', {
        p_month: currentMonth,
        p_year: currentYear
      });

      if (error) {
        console.error('Error fetching summary:', error);
      } else {
        setSummary(data as AttendanceSummary);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [userId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Attendance</h2>
        <p className="text-slate-500">Track your daily attendance and work hours</p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.present_days}</div>
            <div className="text-sm text-slate-500">Days Present</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.half_days}</div>
            <div className="text-sm text-slate-500">Half Days</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.total_hours}h</div>
            <div className="text-sm text-slate-500">Total Hours</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900">{summary.late_marks}</div>
            <div className="text-sm text-slate-500">Late Marks</div>
          </div>
        </div>
      )}

      {/* Daily Attendance Card */}
      <DailyAttendance userId={userId} />

      {/* Attendance History */}
      <AttendanceHistory userId={userId} />
    </div>
  );
};

export default EmployeeAttendanceDashboard;
