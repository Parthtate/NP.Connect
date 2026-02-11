import React, { useState } from 'react';
import { Employee } from '../types';
import { Plus, Search, Edit2, Trash2, Mail, Phone, User as UserIcon, Building, CreditCard, Banknote, Calendar, FileText, X, Download } from 'lucide-react';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import { formatDate } from '../utils/dateUtils';

interface EmployeeListProps {
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, 'id'>, documents?: import('../types').DocumentUpload[]) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  employeeDocuments?: Record<string, import('../types').EmployeeDocument[]>;
  onUploadDocuments?: (employeeId: string, documents: import('../types').DocumentUpload[]) => Promise<void>;
  onDeleteDocument?: (documentId: string, filePath: string) => Promise<void>;
  onGetDocumentUrl?: (filePath: string) => Promise<string | null>;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ 
  employees, 
  onAddEmployee, 
  onUpdateEmployee, 
  onDeleteEmployee,
  employeeDocuments = {},
  onUploadDocuments,
  onDeleteDocument,
  onGetDocumentUrl
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [managingDocumentsFor, setManagingDocumentsFor] = useState<Employee | null>(null);
  
  // State for document upload
  const [selectedFiles, setSelectedFiles] = useState<import('../types').DocumentUpload[]>([]);
  const [documentType, setDocumentType] = useState('pan_card');

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
      
      // Handle document uploads for existing employee
      if (selectedFiles.length > 0 && onUploadDocuments) {
        onUploadDocuments(editingEmployee.id, selectedFiles).then(() => {
          setSelectedFiles([]);
        });
      }
    } else {
      // For new employee, we need to handle this in the parent component
      // We pass the selected files along with employee data if possible, 
      // but the current interface only accepts Omit<Employee, 'id'>
      // So we'll emit a custom event or modify the prop in parent
      // For now, let's assume onAddEmployee handles it or we modify the prop signature
      // We'll modify the call to pass documents as a second argument (need to update interface in types/props)
      
      onAddEmployee(empData, selectedFiles);
    }
    closeModal();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: import('../types').DocumentUpload[] = [];
      Array.from(e.target.files).forEach((file: File) => {
        // limit size to 7MB
        if (file.size > 7 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Max size is 7MB.`);
          return;
        }
        newFiles.push({
          file,
          documentType
        });
      });
      setSelectedFiles([...selectedFiles, ...newFiles]);
      // Reset input
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };
  
  const handleDocumentClick = async (doc: import('../types').EmployeeDocument) => {
    if (onGetDocumentUrl) {
      const url = await onGetDocumentUrl(doc.filePath);
      if (url) {
        window.open(url, '_blank');
      }
    }
  };

  const handleDeleteDocument = async (docId: string, filePath: string) => {
    if (onDeleteDocument && confirm('Are you sure you want to delete this document?')) {
      await onDeleteDocument(docId, filePath);
    }
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
    setSelectedFiles([]);
    setDocumentType('pan_card');
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
                      <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm">
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
                    <span className="flex items-center gap-2">
                      <Calendar size={16} className="text-blue-500" />
                      {formatDate(emp.dateOfJoining)}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setManagingDocumentsFor(emp);
                      }}
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Manage Documents"
                    >
                      <FileText size={18} />
                    </button>
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
        maxWidth="max-w-3xl"
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
                <input 
                  name="fullName" 
                  defaultValue={editingEmployee?.fullName} 
                  required 
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm placeholder-slate-400" 
                  placeholder="e.g. John Doe" 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!/^[a-zA-Z\s]*$/.test(val)) {
                      e.target.value = val.replace(/[^a-zA-Z\s]/g, '');
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Mobile *</label>
                <input 
                  name="mobile" 
                  defaultValue={editingEmployee?.mobile} 
                  required 
                  maxLength={10}
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-900 text-sm placeholder-slate-400" 
                  placeholder="10-digit number" 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!/^\d*$/.test(val)) {
                      e.target.value = val.replace(/\D/g, '');
                    }
                  }}
                />
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


          {/* Section 3: Documents (New) */}
          <div>
            <h4 className="flex items-center text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
              <FileText size={16} className="mr-2 text-slate-600" /> Documents
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Upload Document</label>
                  <div className="flex gap-2 mb-2">
                    <select 
                      className="p-2 border border-slate-300 rounded text-sm bg-white"
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value)}
                    >
                      <option value="pan_card">PAN Card</option>
                      <option value="aadhaar_card">Aadhaar Card</option>
                      <option value="payslip">Payslip</option>
                      <option value="offer_letter">Offer Letter</option>
                      <option value="other">Other</option>
                    </select>
                    <input 
                      type="file" 
                      multiple
                      onChange={handleFileSelect}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  
                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2 mt-3">
                      <p className="text-xs font-bold text-slate-500">Files to Upload:</p>
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100 text-sm">
                          <span className="truncate max-w-[200px]">{file.file.name} ({file.documentType})</span>
                          <button type="button" onClick={() => removeFile(idx)} className="text-red-500"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               {/* Existing Documents List (Edit Mode) */}
               {editingEmployee && employeeDocuments[editingEmployee.id]?.length > 0 && (
                 <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Existing Documents</label>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto">
                      {employeeDocuments[editingEmployee.id].map(doc => (
                        <div key={doc.id} className="flex justify-between items-center p-2 bg-white border border-slate-200 rounded text-sm hover:bg-slate-50">
                           <div className="flex items-center gap-2 overflow-hidden cursor-pointer" onClick={() => handleDocumentClick(doc)}>
                             <FileText size={14} className="text-blue-500 shrink-0" />
                             <span className="truncate text-blue-600 hover:underline">{doc.fileName}</span>
                           </div>
                           <button type="button" onClick={() => handleDeleteDocument(doc.id, doc.filePath)} className="text-slate-400 hover:text-red-500">
                             <Trash2 size={14} />
                           </button>
                        </div>
                      ))}
                    </div>
                 </div>
               )}
            </div>
          </div>

          {/* Section 4: Financial Info */}
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
      <DocumentManagerModal 
        employee={managingDocumentsFor} 
        isOpen={!!managingDocumentsFor} 
        onClose={() => setManagingDocumentsFor(null)}
        documents={managingDocumentsFor ? (employeeDocuments[managingDocumentsFor.id] || []) : []}
        onUpload={onUploadDocuments}
        onDelete={onDeleteDocument}
        onView={onGetDocumentUrl}
        onDeleteDocument={onDeleteDocument}
      />
    </div>
  );
};

interface DocumentManagerModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  documents: import('../types').EmployeeDocument[];
  onUpload?: (employeeId: string, documents: import('../types').DocumentUpload[]) => Promise<void>;
  onDelete?: (documentId: string, filePath: string) => Promise<void>;
  onView?: (filePath: string) => Promise<string | null>;
  onDeleteDocument?: (documentId: string, filePath: string) => Promise<void>;
}

const DocumentManagerModal: React.FC<DocumentManagerModalProps> = ({ employee, isOpen, onClose, documents, onUpload, onDelete, onView }) => {
  const [selectedFiles, setSelectedFiles] = useState<import('../types').DocumentUpload[]>([]);
  const [documentType, setDocumentType] = useState('pan_card');
  const [isUploading, setIsUploading] = useState(false);

  if (!employee) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: import('../types').DocumentUpload[] = [];
      Array.from(e.target.files).forEach((file: File) => {
        if (file.size > 7 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Max size is 7MB.`);
          return;
        }
        newFiles.push({ file, documentType });
      });
      setSelectedFiles([...selectedFiles, ...newFiles]);
      e.target.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  const handleUpload = async () => {
    if (onUpload && selectedFiles.length > 0) {
      setIsUploading(true);
      await onUpload(employee.id, selectedFiles);
      setIsUploading(false);
      setSelectedFiles([]);
    }
  };

  const handleDelete = async (doc: import('../types').EmployeeDocument) => {
    if (onDelete && confirm('Are you sure you want to delete this document?')) {
      await onDelete(doc.id, doc.filePath);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Documents - ${employee.fullName}`} maxWidth="max-w-2xl">
      <div className="space-y-6">
        {/* Upload Section */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
           <h4 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
             <Plus size={16} className="text-blue-600" /> Upload New Document
           </h4>
           <div className="flex gap-2 mb-3">
             <select 
               className="p-2 border border-slate-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
               value={documentType}
               onChange={(e) => setDocumentType(e.target.value)}
             >
               <option value="pan_card">PAN Card</option>
               <option value="aadhaar_card">Aadhaar Card</option>
               <option value="payslip">Payslip</option>
               <option value="offer_letter">Offer Letter</option>
               <option value="contract">Contract</option>
               <option value="resume">Resume</option>
               <option value="other">Other</option>
             </select>
             <input 
               type="file" 
               multiple
               onChange={handleFileSelect}
               className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white file:text-blue-700 hover:file:bg-blue-50 border border-slate-200 rounded cursor-pointer"
             />
           </div>
           
           {selectedFiles.length > 0 && (
             <div className="space-y-2">
               {selectedFiles.map((file, idx) => (
                 <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border border-slate-200 text-sm">
                   <span className="truncate">{file.file.name} <span className="text-slate-400 text-xs">({file.documentType})</span></span>
                   <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                 </div>
               ))}
               <button 
                 onClick={handleUpload}
                 disabled={isUploading}
                 className="w-full mt-2 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
               >
                 {isUploading ? 'Uploading...' : 'Upload Files'}
               </button>
             </div>
           )}
        </div>

        {/* List Section */}
        <div>
           <h4 className="text-sm font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
             <FileText size={16} className="text-slate-600" /> Existing Documents ({documents.length})
           </h4>
           <div className="space-y-2 max-h-[300px] overflow-y-auto">
             {documents.map(doc => (
               <div key={doc.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={async () => {
                    if (onView) {
                      const url = await onView(doc.filePath);
                      if (url) window.open(url, '_blank');
                    }
                  }}>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 text-sm truncate">{doc.fileName}</p>
                      <p className="text-xs text-slate-500 capitalize">{doc.documentType.replace(/_/g, ' ')} • {(doc.fileSize / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(doc)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 size={16} />
                  </button>
               </div>
             ))}
             {documents.length === 0 && (
               <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                 No documents found for this employee
               </div>
             )}
           </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeList;