-- Function to link profile to employee on insert/update of PROFILE
CREATE OR REPLACE FUNCTION public.link_profile_to_employee()
RETURNS TRIGGER AS $$
BEGIN
  -- Find matching employee by email
  -- We use a simple update based on email match
  UPDATE public.profiles
  SET employee_id = (SELECT id FROM public.employees WHERE email = NEW.email)
  WHERE id = NEW.id AND employee_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link employee to profile on insert/update of EMPLOYEE
CREATE OR REPLACE FUNCTION public.link_employee_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Update matching profile with this employee's ID
  UPDATE public.profiles
  SET employee_id = NEW.id
  WHERE email = NEW.email AND employee_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist to allow clean re-run
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
DROP TRIGGER IF EXISTS on_employee_created ON public.employees;

-- Create Triggers
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.link_profile_to_employee();

CREATE TRIGGER on_employee_created
  AFTER INSERT ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.link_employee_to_profile();
