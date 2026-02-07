import React, { useState } from 'react';
import { CompanySettings, Holiday } from '../types';
import { Plus, Trash2, Calendar, Save, Settings } from 'lucide-react';

interface SettingsViewProps {
  settings: CompanySettings;
  holidays: Holiday[];
  onUpdateSettings: (settings: CompanySettings) => void;
  onAddHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  onDeleteHoliday: (id: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, holidays, onUpdateSettings, onAddHoliday, onDeleteHoliday }) => {
  const [workingDays, setWorkingDays] = useState(settings.defaultWorkingDays);
  
  // Holiday Form State
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');

  const handleSaveSettings = () => {
    onUpdateSettings({ ...settings, defaultWorkingDays: workingDays });
    alert('Settings saved successfully!');
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayDate || !holidayName) return;
    
    onAddHoliday({
      date: holidayDate,
      name: holidayName
    });
    setHolidayDate('');
    setHolidayName('');
  };

  // Sort holidays by date
  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
        <p className="text-slate-500">Configure company policies and holidays</p>
      </div>

      {/* General Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
           <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Settings size={24} />
           </div>
           <h3 className="text-lg font-bold text-slate-800">Payroll Configuration</h3>
        </div>
        
        <div className="max-w-md">
          <label className="block text-sm font-bold text-slate-700 mb-2">Default Working Days per Month</label>
          <div className="flex gap-4">
             <input 
               type="number" 
               min="1" 
               max="30"
               value={workingDays}
               onChange={(e) => setWorkingDays(Number(e.target.value))}
               className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
             />
             <button 
               onClick={handleSaveSettings}
               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
             >
               <Save size={18} /> Save
             </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">This value will be used as the default denominator for daily salary calculation during payroll processing.</p>
        </div>
      </div>

      {/* Holiday Management */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
           <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <Calendar size={24} />
           </div>
           <h3 className="text-lg font-bold text-slate-800">Holiday Announcements</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Add Form */}
           <div>
              <h4 className="font-bold text-slate-800 mb-4">Announce New Holiday</h4>
              <form onSubmit={handleAddHoliday} className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Date</label>
                    <input 
                      type="date" 
                      required
                      value={holidayDate}
                      onChange={(e) => setHolidayDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900"
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Holiday Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Independence Day"
                      required
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-400"
                    />
                 </div>
                 <button 
                   type="submit"
                   className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm font-medium"
                 >
                   <Plus size={18} /> Add Holiday
                 </button>
              </form>
           </div>

           {/* Holiday List */}
           <div>
              <h4 className="font-bold text-slate-800 mb-4">Upcoming Holidays</h4>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                 {sortedHolidays.length > 0 ? sortedHolidays.map(holiday => (
                   <div key={holiday.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-all group">
                      <div className="flex items-center gap-3">
                         <div className="flex flex-col items-center justify-center w-12 h-12 bg-orange-50 rounded-lg text-orange-600 border border-orange-100 group-hover:bg-orange-100 transition-colors">
                            <span className="text-xs font-bold uppercase">{new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-lg font-bold">{new Date(holiday.date).getDate()}</span>
                         </div>
                         <div>
                            <p className="font-bold text-slate-900">{holiday.name}</p>
                            <p className="text-xs text-slate-500 font-medium">{new Date(holiday.date).getFullYear()}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => onDeleteHoliday(holiday.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Holiday"
                      >
                         <Trash2 size={18} />
                      </button>
                   </div>
                 )) : (
                   <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                      <Calendar className="mx-auto mb-2 text-slate-300" size={32} />
                      <p>No holidays announced yet.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;