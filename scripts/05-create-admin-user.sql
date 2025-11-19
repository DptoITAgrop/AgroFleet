-- Create admin user with password
-- Password: Admin123! (you should change this after first login)
-- This creates a user in Supabase Auth and links it to the employees table

-- First, we need to insert into auth.users (this is handled by Supabase Auth)
-- We'll create a function to do this safely

-- Insert admin employee if not exists
INSERT INTO employees (id, email, full_name, department, phone, is_admin) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@agroptimum.com', 'Administrador', 'Administración', '+34 600 000 000', true)
ON CONFLICT (email) DO UPDATE SET is_admin = true;

-- Note: You need to create the user in Supabase Auth manually or via the Supabase dashboard
-- Email: admin@agroptimum.com
-- Password: Admin123!
-- Then link it to the employee record above
