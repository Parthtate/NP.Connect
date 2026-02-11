import React, { useState } from 'react';
import { PayrollRecord, Employee, UserRole, CompanySettings } from '../types';
import { Calculator, FileText, Download, DollarSign, Settings2, PlusCircle, MinusCircle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface PayrollViewProps {
  role: UserRole;
  employees: Employee[];
  payroll: Record<string, PayrollRecord>;
  currentEmployeeId?: string;
  settings: CompanySettings;
  onProcessPayroll: (month: string, workingDays: number, adjustments: Record<string, { allowance: number, deduction: number }>) => void;
}

const PayrollView: React.FC<PayrollViewProps> = ({ role, employees, payroll, currentEmployeeId, settings, onProcessPayroll }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [payslipData, setPayslipData] = useState<{emp: Employee, record: PayrollRecord} | null>(null);
  
  // Processing State
  const [isProcessingModalOpen, setIsProcessingModalOpen] = useState(false);
  const [workingDaysInput, setWorkingDaysInput] = useState(settings.defaultWorkingDays);
  const [adjustments, setAdjustments] = useState<Record<string, { allowance: number, deduction: number }>>({});

  const initiateProcess = () => {
    // Reset adjustments when opening
    const initialAdjustments: Record<string, { allowance: number, deduction: number }> = {};
    employees.forEach(emp => {
      initialAdjustments[emp.id] = { allowance: 0, deduction: 0 };
    });
    setAdjustments(initialAdjustments);
    setWorkingDaysInput(settings.defaultWorkingDays);
    setIsProcessingModalOpen(true);
  };

  const handleAdjustmentChange = (empId: string, field: 'allowance' | 'deduction', value: string) => {
    const numVal = parseFloat(value) || 0;
    setAdjustments(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: numVal
      }
    }));
  };

  const handleConfirmProcess = () => {
    onProcessPayroll(selectedMonth, workingDaysInput, adjustments);
    setIsProcessingModalOpen(false);
  };

  const openPayslip = (empId: string, month: string) => {
    const key = `${empId}-${month}`;
    const record = payroll[key];
    const emp = employees.find(e => e.id === empId);
    if (record && emp) {
      setPayslipData({ emp, record });
    }
  };

  // EMPLOYEE VIEW
  if (role === UserRole.EMPLOYEE && currentEmployeeId) {
    const myPayrolls = (Object.values(payroll) as PayrollRecord[]).filter((p) => p.employeeId === currentEmployeeId);
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Payslips</h2>
          <p className="text-slate-500">View and download your salary slips</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myPayrolls.length > 0 ? myPayrolls.map(rec => (
            <div key={`${rec.employeeId}-${rec.month}`} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                   <FileText size={24} />
                 </div>
                 <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Processed</span>
              </div>
              <p className="text-sm text-slate-500">Month</p>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{new Date(rec.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
              <p className="text-sm text-slate-500">Net Pay</p>
              <p className="text-2xl font-bold text-green-600 mb-4">₹{rec.net.toFixed(0)}</p>
              <button 
                onClick={() => openPayslip(rec.employeeId, rec.month)}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={18} /> <span>View Payslip</span>
              </button>
            </div>
          )) : (
            <div className="col-span-3 text-center py-12 text-slate-500">No payslips found</div>
          )}
        </div>
        {payslipData && (
           <PayslipModal data={payslipData} onClose={() => setPayslipData(null)} />
        )}
      </div>
    );
  }

  // HR VIEW
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Payroll Management</h2>
        <p className="text-slate-500">Process and manage employee salaries</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-end gap-4">
         <div className="flex-1 w-full">
           <label className="block text-sm font-bold text-slate-700 mb-2">Select Payroll Month</label>
           <input 
             type="month" 
             value={selectedMonth} 
             onChange={(e) => setSelectedMonth(e.target.value)}
             className="w-full p-2.5 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
           />
         </div>
         <button 
           onClick={initiateProcess}
           className="w-full md:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-sm"
         >
           <Calculator size={20} />
           <span>Run Payroll Wizard</span>
         </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
           <h3 className="text-lg font-semibold text-slate-800">Payroll Summary ({selectedMonth})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-slate-50 border-b border-slate-200">
               <tr>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Employee</th>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Basic</th>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Allowances</th>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Ad-hoc</th>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Deductions</th>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Net Salary</th>
                 <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-center">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {employees.map(emp => {
                  const key = `${emp.id}-${selectedMonth}`;
                  const record = payroll[key];
                  return (
                    <tr key={emp.id}>
                      <td className="p-4 font-medium text-slate-900">{emp.fullName}</td>
                      <td className="p-4 text-right">₹{record ? record.basic.toFixed(0) : emp.salary.basic}</td>
                      <td className="p-4 text-right">₹{record ? (record.hra + record.allowances).toFixed(0) : (emp.salary.hra + emp.salary.allowances)}</td>
                      <td className="p-4 text-right">
                         {record ? (
                           <div className="flex flex-col text-xs">
                              {record.adHocAllowance > 0 && <span className="text-green-600">+{record.adHocAllowance}</span>}
                              {record.adHocDeduction > 0 && <span className="text-red-600">-{record.adHocDeduction}</span>}
                              {record.adHocAllowance === 0 && record.adHocDeduction === 0 && <span className="text-slate-400">-</span>}
                           </div>
                         ) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="p-4 text-right text-red-600">₹{record ? record.deductions.toFixed(0) : emp.salary.deductions}</td>
                      <td className="p-4 text-right font-bold text-green-600">
                         ₹{record ? record.net.toFixed(0) : (emp.salary.basic + emp.salary.hra + emp.salary.allowances - emp.salary.deductions).toFixed(0)}
                      </td>
                      <td className="p-4 text-center">
                        <button 
                          disabled={!record}
                          onClick={() => openPayslip(emp.id, selectedMonth)}
                          className={`p-2 rounded-lg transition-colors ${record ? 'text-blue-600 hover:bg-blue-50' : 'text-slate-300 cursor-not-allowed'}`}
                        >
                          <FileText size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
             </tbody>
          </table>
        </div>
      </div>

      {/* Payslip Modal */}
      {payslipData && (
         <PayslipModal data={payslipData} onClose={() => setPayslipData(null)} />
      )}

      {/* Processing Wizard Modal */}
      <Modal isOpen={isProcessingModalOpen} onClose={() => setIsProcessingModalOpen(false)} title="Run Payroll Wizard" maxWidth="max-w-4xl">
         <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
               <h4 className="text-sm font-bold text-slate-700 uppercase mb-4 flex items-center gap-2">
                 <Settings2 size={16} /> Configuration
               </h4>
               <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Processing For</label>
                    <div className="text-lg font-bold text-slate-900">{new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Total Working Days</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="31"
                      value={workingDaysInput}
                      onChange={(e) => setWorkingDaysInput(Number(e.target.value))}
                      className="w-32 p-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium focus:ring-2 focus:ring-blue-500" 
                    />
                    <span className="text-xs text-slate-400 ml-2">(Default from Settings)</span>
                  </div>
               </div>
            </div>

            <div>
               <h4 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                  <DollarSign size={16} /> Ad-hoc Adjustments
               </h4>
               <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                 <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                       <tr>
                          <th className="p-3">Employee</th>
                          <th className="p-3 w-48">Ad-hoc Allowance (Bonus)</th>
                          <th className="p-3 w-48">Ad-hoc Deduction (Fine)</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                       {employees.map(emp => (
                         <tr key={emp.id} className="hover:bg-slate-50">
                            <td className="p-3 font-medium text-slate-800">{emp.fullName}</td>
                            <td className="p-3">
                               <div className="flex items-center gap-2">
                                  <PlusCircle size={16} className="text-green-500" />
                                  <input 
                                    type="number" 
                                    min="0"
                                    placeholder="0"
                                    className="w-full p-1.5 border border-slate-300 rounded focus:border-green-500 outline-none bg-white text-slate-900 text-sm placeholder-slate-400"
                                    value={adjustments[emp.id]?.allowance || ''}
                                    onChange={(e) => handleAdjustmentChange(emp.id, 'allowance', e.target.value)}
                                  />
                               </div>
                            </td>
                            <td className="p-3">
                               <div className="flex items-center gap-2">
                                  <MinusCircle size={16} className="text-red-500" />
                                  <input 
                                    type="number" 
                                    min="0"
                                    placeholder="0"
                                    className="w-full p-1.5 border border-slate-300 rounded focus:border-red-500 outline-none bg-white text-slate-900 text-sm placeholder-slate-400"
                                    value={adjustments[emp.id]?.deduction || ''}
                                    onChange={(e) => handleAdjustmentChange(emp.id, 'deduction', e.target.value)}
                                  />
                               </div>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
               <button onClick={() => setIsProcessingModalOpen(false)} className="px-5 py-2.5 text-slate-700 font-medium hover:bg-slate-100 rounded-lg">Cancel</button>
               <button onClick={handleConfirmProcess} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2 shadow-sm">
                  <Calculator size={18} /> Confirm & Process Payroll
               </button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

const PayslipModal = ({ data, onClose }: { data: {emp: Employee, record: PayrollRecord}, onClose: () => void }) => {
  const { emp, record } = data;
  const monthName = new Date(record.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('payslip-content');
    if (!element) return;
    
    setIsDownloading(true);

    try {
      // Small delay to let UI render if needed
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      
      // If content is longer than one page (unlikely for payslip but good practice)
      heightLeft -= pageHeight;
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`payslip_${record.month}_${emp.fullName.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Payslip - ${monthName}`} maxWidth="max-w-4xl">
      <div className="p-8 bg-white" id="payslip-content">
        <div className="text-center mb-8 pb-8 border-b border-slate-200">
           <h1 className="text-3xl font-bold text-slate-900">NPPMT Group</h1>
           <p className="text-slate-500">Workforce Portal - HR Management System</p>
           <div className="mt-4 inline-block bg-slate-900 text-white px-4 py-1 rounded text-sm font-bold uppercase tracking-wide">Salary Slip</div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
           <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-bold text-slate-800 mb-3 uppercase text-xs tracking-wider">Employee Details</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>Name:</span> <span className="font-medium text-slate-900">{emp.fullName}</span></div>
                <div className="flex justify-between"><span>ID:</span> <span className="font-medium text-slate-900">{emp.id}</span></div>
                <div className="flex justify-between"><span>Designation:</span> <span className="font-medium text-slate-900">{emp.designation}</span></div>
                <div className="flex justify-between"><span>Department:</span> <span className="font-medium text-slate-900">{emp.department}</span></div>
              </div>
           </div>
           <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-bold text-slate-800 mb-3 uppercase text-xs tracking-wider">Payment Details</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between"><span>Bank:</span> <span className="font-medium text-slate-900">{emp.bankAccount.bankName}</span></div>
                <div className="flex justify-between"><span>Account:</span> <span className="font-medium text-slate-900">{emp.bankAccount.number}</span></div>
                <div className="flex justify-between"><span>Days Present:</span> <span className="font-medium text-slate-900">{record.presentDays + (record.halfDays * 0.5)} / {record.workingDays}</span></div>
              </div>
           </div>
        </div>

        <table className="w-full mb-8 border-collapse border border-slate-200">
           <thead>
             <tr className="bg-slate-50">
               <th className="p-3 text-left border border-slate-200 text-sm font-semibold text-slate-700">Earnings</th>
               <th className="p-3 text-right border border-slate-200 text-sm font-semibold text-slate-700">Amount (₹)</th>
               <th className="p-3 text-left border border-slate-200 text-sm font-semibold text-slate-700">Deductions</th>
               <th className="p-3 text-right border border-slate-200 text-sm font-semibold text-slate-700">Amount (₹)</th>
             </tr>
           </thead>
           <tbody className="text-sm">
             <tr>
               <td className="p-3 border border-slate-200">Basic Salary</td>
               <td className="p-3 border border-slate-200 text-right">{record.basic.toFixed(2)}</td>
               <td className="p-3 border border-slate-200">Tax/PF</td>
               <td className="p-3 border border-slate-200 text-right">{record.deductions.toFixed(2)}</td>
             </tr>
             <tr>
               <td className="p-3 border border-slate-200">HRA</td>
               <td className="p-3 border border-slate-200 text-right">{record.hra.toFixed(2)}</td>
               <td className="p-3 border border-slate-200">Other Adjustments</td>
               <td className="p-3 border border-slate-200 text-right">{record.adHocDeduction.toFixed(2)}</td>
             </tr>
             <tr>
               <td className="p-3 border border-slate-200">Allowances</td>
               <td className="p-3 border border-slate-200 text-right">{record.allowances.toFixed(2)}</td>
               <td className="p-3 border border-slate-200"></td>
               <td className="p-3 border border-slate-200 text-right"></td>
             </tr>
             <tr>
               <td className="p-3 border border-slate-200">Ad-hoc Bonus</td>
               <td className="p-3 border border-slate-200 text-right">{record.adHocAllowance.toFixed(2)}</td>
               <td className="p-3 border border-slate-200"></td>
               <td className="p-3 border border-slate-200 text-right"></td>
             </tr>
             <tr className="bg-slate-50 font-bold">
               <td className="p-3 border border-slate-200">Gross Earnings</td>
               <td className="p-3 border border-slate-200 text-right">{record.gross.toFixed(2)}</td>
               <td className="p-3 border border-slate-200">Total Deductions</td>
               <td className="p-3 border border-slate-200 text-right">{(record.deductions + record.adHocDeduction).toFixed(2)}</td>
             </tr>
           </tbody>
        </table>

        <div className="flex justify-end">
           <div className="bg-indigo-50 border-2 border-indigo-500 rounded-xl p-6 text-center min-w-[200px]">
              <p className="text-xs text-indigo-600 font-bold uppercase mb-1">Net Salary</p>
              <p className="text-3xl font-bold text-indigo-700">₹{record.net.toFixed(0)}</p>
           </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
           This is a computer-generated document and does not require a physical signature.
        </div>
      </div>
      <div className="flex justify-end p-6 bg-slate-50 border-t border-slate-200 gap-3">
         <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg">Close</button>
         <button 
           onClick={handleDownloadPDF} 
           disabled={isDownloading}
           className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
         >
            {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
            {isDownloading ? 'Generating...' : 'Download PDF'}
         </button>
      </div>
    </Modal>
  )
}

export default PayrollView;