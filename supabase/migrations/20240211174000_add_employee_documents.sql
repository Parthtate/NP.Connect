-- Create employee_documents table
CREATE TABLE IF NOT EXISTS public.employee_documents (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  employee_id TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  CONSTRAINT employee_documents_pkey PRIMARY KEY (id),
  CONSTRAINT employee_documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE,
  CONSTRAINT employee_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;

-- Policies for employee_documents table
-- HR/Admin can do everything
CREATE POLICY "HR and Admin can manage documents" ON public.employee_documents
  FOR ALL USING (get_user_role() IN ('HR', 'ADMIN'));

-- Employees can view their own document METADATA
CREATE POLICY "Employees can view own document metadata" ON public.employee_documents
  FOR SELECT USING (
    employee_id = (SELECT employee_id FROM profiles WHERE id = auth.uid())
  );

-- Indexes
CREATE INDEX idx_employee_documents_employee ON public.employee_documents(employee_id);

-- Storage bucket creation (if not exists) is handled via Supabase dashboard usually, 
-- but we can set up policies here assuming the bucket 'employee-documents' exists.
-- NOTE: User must create 'employee-documents' bucket in Supabase Storage dashboard manually if not exists.

-- Storage Policies (Run these in Supabase SQL Editor if storage.objects is accessible, or use Dashboard)

-- Policy 1: HR and ADMIN have full access to employee-documents bucket
-- CREATE POLICY "HR/Admin Full Access"
-- ON storage.objects
-- FOR ALL
-- TO authenticated
-- USING (
--   bucket_id = 'employee-documents' 
--   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('HR', 'ADMIN')
-- )
-- WITH CHECK (
--   bucket_id = 'employee-documents' 
--   AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('HR', 'ADMIN')
-- );

-- Policy 2: Employees can read their own folder
-- CREATE POLICY "Employee Read Own Folder"
-- ON storage.objects
-- FOR SELECT
-- TO authenticated
-- USING (
--   bucket_id = 'employee-documents' 
--   AND (storage.foldername(name))[1] = (SELECT employee_id FROM profiles WHERE id = auth.uid())
-- );

COMMENT ON TABLE public.employee_documents IS 'Metadata for employee documents uploaded to Storage';
