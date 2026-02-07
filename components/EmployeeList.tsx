import React, { useState } from 'react';
import { Employee } from '../types';
import { Plus, Search, Edit2, Trash2, Mail, Phone, User as UserIcon, Building, CreditCard, Banknote } from 'lucide-react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';

interface EmployeeListProps {
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, onAddEmployee, onUpdateEmployee, onDeleteEmployee }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  
  // State for delete confirmation
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);

  const filteredEmployees = employees.filter(emp => 
    emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const empData: any = {
      fullName: formData.get('fullName'),
      mobile: formData.get('mobile'),
      email: formData.get('email'),
      department: formData.get('department'),
      designation: formData.get('designation'),
      dateOfJoining: formData.get('dateOfJoining'),
      salary: {
        basic: Number(formData.get('basic')),
        hra: Number(formData.get('hra')),
        allowances: Number(formData.get('allowances')),
        deductions: Number(formData.get('deductions')),
      },
      bankAccount: {
        number: formData.get('accountNumber'),
        ifsc: formData.get('ifsc'),
        bankName: formData.get('bankName'),
      }
    };

    if (editingEmployee) {
      onUpdateEmployee({ ...editingEmployee, ...empData });
    } else {
      onAddEmployee(empData);
    }
    closeModal();
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setIsModalOpen(true);
  };

  const initiateDelete = (emp: Employee) => {
    setEmployeeToDelete(emp);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      onDeleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Employee Management</h2>
          <p className="text-slate-500">Manage your workforce details</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl shadow-md shadow-blue-200 transition-all hover:shadow-lg"
        >
          <Plus size={20} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Search Bar - Improved UI */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, email or department..." 
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white placeholder-slate-400 text-slate-900"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Employee</th>
                <th className="p-4">Contact</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                         {emp.fullName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{emp.fullName}</div>
                        <div className="text-xs text-slate-500">{emp.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center text-slate-600">
                        <Mail size={14} className="mr-2 text-slate-400" /> {emp.email}
                      </div>
                      <div className="flex items-center text-slate-600">
                        <Phone size={14} className="mr-2 text-slate-400" /> {emp.mobile}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-slate-900 font-medium">{emp.designation}</div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                      {emp.department}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {new Date(emp.dateOfJoining).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => openEdit(emp)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        initiateDelete(emp);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEmployees.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            <UserIcon size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-lg font-medium">No employees found</p>
            <p className="text-sm">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        title={editingEmployee ? "Edit Employee Profile" : "Create New Employee"}
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Personal Info */}
          <div>
            <h4 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              <UserIcon size={16} className="mr-2 text-blue-600" /> Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Full Name *</label>
                <input name="fullName" defaultValue={editingEmployee?.fullName} required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm placeholder-slate-400" placeholder="e.g. John Doe" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Mobile *</label>
                <input name="mobile" defaultValue={editingEmployee?.mobile} required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm placeholder-slate-400" placeholder="+1 234 567 890" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Email *</label>
                <input name="email" type="email" defaultValue={editingEmployee?.email} required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm placeholder-slate-400" placeholder="john@company.com" />
              </div>
            </div>
          </div>

          {/* Section 2: Professional Info */}
          <div>
            <h4 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              <Building size={16} className="mr-2 text-purple-600" /> Professional Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Department *</label>
                <input name="department" defaultValue={editingEmployee?.department} required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900 text-sm placeholder-slate-400" placeholder="e.g. Engineering" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Designation *</label>
                <input name="designation" defaultValue={editingEmployee?.designation} required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900 text-sm placeholder-slate-400" placeholder="e.g. Senior Developer" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Date of Joining *</label>
                <input name="dateOfJoining" type="date" defaultValue={editingEmployee?.dateOfJoining} required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-slate-900 text-sm" />
              </div>
            </div>
          </div>

          {/* Section 3: Financial Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                <Banknote size={16} className="mr-2 text-green-600" /> Salary Structure
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Basic Salary *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                    <input name="basic" type="number" defaultValue={editingEmployee?.salary.basic} required className="w-full pl-6 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900 text-sm placeholder-slate-400" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">HRA *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                    <input name="hra" type="number" defaultValue={editingEmployee?.salary.hra} required className="w-full pl-6 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900 text-sm placeholder-slate-400" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Allowances *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                    <input name="allowances" type="number" defaultValue={editingEmployee?.salary.allowances} required className="w-full pl-6 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-slate-900 text-sm placeholder-slate-400" placeholder="0" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Deductions</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                    <input name="deductions" type="number" defaultValue={editingEmployee?.salary.deductions || 0} className="w-full pl-6 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-slate-900 text-sm placeholder-slate-400" placeholder="0" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                <CreditCard size={16} className="mr-2 text-orange-600" /> Bank Information
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Bank Name *</label>
                    <input name="bankName" defaultValue={editingEmployee?.bankAccount.bankName} required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-slate-900 text-sm placeholder-slate-400" placeholder="e.g. HDFC Bank" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Account Number *</label>
                    <input name="accountNumber" defaultValue={editingEmployee?.bankAccount.number} required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-slate-900 text-sm placeholder-slate-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">IFSC Code *</label>
                    <input name="ifsc" defaultValue={editingEmployee?.bankAccount.ifsc} required className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white text-slate-900 text-sm placeholder-slate-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100">
            <button type="button" onClick={closeModal} className="px-6 py-2.5 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold transition-colors">Cancel</button>
            <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5">
              {editingEmployee ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={!!employeeToDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete employee "${employeeToDelete?.fullName}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete Employee"
        onConfirm={confirmDelete}
        onCancel={() => setEmployeeToDelete(null)}
        variant="danger"
      />
    </div>
  );
};

export default EmployeeList;