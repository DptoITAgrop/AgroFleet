-- Función para crear registro de usuario para nuevos usuarios
-- Esta función se ejecuta con SECURITY DEFINER para evitar RLS
CREATE OR REPLACE FUNCTION create_employee_for_user(
  user_id UUID,
  user_email TEXT,
  user_name TEXT DEFAULT NULL,
  user_department TEXT DEFAULT 'General',
  make_admin BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  department TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user RECORD;
BEGIN
  -- Using 'usuarios' table instead of 'employees'
  -- Check if user already exists
  SELECT * INTO existing_user FROM usuarios WHERE usuarios.id = user_id;
  
  IF existing_user.id IS NOT NULL THEN
    RETURN QUERY SELECT 
      existing_user.id,
      existing_user.email,
      existing_user.full_name,
      existing_user.department,
      existing_user.is_admin,
      existing_user.created_at;
    RETURN;
  END IF;
  
  -- Create new user record
  RETURN QUERY
  INSERT INTO usuarios (id, email, full_name, department, is_admin)
  VALUES (
    user_id,
    user_email,
    COALESCE(user_name, split_part(user_email, '@', 1)),
    user_department,
    make_admin
  )
  RETURNING 
    usuarios.id,
    usuarios.email,
    usuarios.full_name,
    usuarios.department,
    usuarios.is_admin,
    usuarios.created_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_employee_for_user TO authenticated;

-- Update RLS policy to allow users to create their own user record via the function
DROP POLICY IF EXISTS "Only admins can insert usuarios" ON usuarios;

CREATE POLICY "Only admins can insert usuarios"
  ON usuarios FOR INSERT
  WITH CHECK (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE usuarios.id = auth.uid() AND usuarios.is_admin = true
    )
    -- OR if inserting their own record (for first-time users)
    OR id = auth.uid()
  );
