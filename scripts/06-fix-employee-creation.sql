-- Function to create employee record for new users
-- This function runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION create_employee_for_user(
  user_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT NULL,
  user_department TEXT DEFAULT 'General',
  make_admin BOOLEAN DEFAULT false
)
RETURNS employees
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_employee employees;
BEGIN
  -- Check if employee already exists
  SELECT * INTO new_employee FROM employees WHERE id = user_id;
  
  IF new_employee.id IS NOT NULL THEN
    RETURN new_employee;
  END IF;
  
  -- Fixed column name from 'name' to 'full_name' to match table schema
  -- Create new employee record
  INSERT INTO employees (id, email, full_name, department, is_admin)
  VALUES (
    user_id,
    user_email,
    COALESCE(user_name, split_part(user_email, '@', 1)),
    user_department,
    make_admin
  )
  RETURNING * INTO new_employee;
  
  RETURN new_employee;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_employee_for_user TO authenticated;

-- Update RLS policy to allow users to create their own employee record via the function
DROP POLICY IF EXISTS "Only admins can insert employees" ON employees;

CREATE POLICY "Only admins can insert employees"
  ON employees FOR INSERT
  WITH CHECK (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND is_admin = true
    )
    -- OR if inserting their own record (for first-time users)
    OR id = auth.uid()
  );
