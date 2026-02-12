-- Create get_user_role function if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects -- REMOVED: Requires ownership. Ensure RLS is enabled in Dashboard if needed.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts
DROP POLICY IF EXISTS "HR and Admin Full Access" ON storage.objects;
DROP POLICY IF EXISTS "Employees View Own" ON storage.objects;
DROP POLICY IF EXISTS "Give HR and Admin access to employee-documents" ON storage.objects;
DROP POLICY IF EXISTS "Give Employees read access to own folder" ON storage.objects;

-- Policy 1: HR and Admin have full access to 'employee-documents' bucket
CREATE POLICY "HR and Admin Full Access"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'employee-documents' 
  AND (public.get_user_role() IN ('HR', 'ADMIN'))
)
WITH CHECK (
  bucket_id = 'employee-documents' 
  AND (public.get_user_role() IN ('HR', 'ADMIN'))
);

-- Policy 2: Employees can view files in their own folder (folder name = employee_id)
-- We assume the file path format is: {employee_id}/{filename}
CREATE POLICY "Employees View Own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-documents' 
  AND (storage.foldername(name))[1] = (SELECT employee_id FROM public.profiles WHERE id = auth.uid())
);
