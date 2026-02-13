import React from 'react';
import { EmployeeDocument, UserRole } from '../../types';
import { FileText, Download, Eye } from 'lucide-react';

interface DocumentsViewProps {
  documents: EmployeeDocument[];
  onGetDocumentUrl?: (filePath: string) => Promise<string | null>;
}

const DocumentsView: React.FC<DocumentsViewProps> = ({ documents, onGetDocumentUrl }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Documents</h2>
          <p className="text-slate-500 mt-1">View and download your personal documents</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {documents.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{doc.fileName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {doc.documentType.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-slate-400">
                        • {(doc.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={async () => {
                      if (onGetDocumentUrl) {
                        const url = await onGetDocumentUrl(doc.filePath);
                        if (url) window.open(url, '_blank');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No documents found</h3>
            <p className="text-slate-500 mt-1">Any documents uploaded by HR will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsView;
