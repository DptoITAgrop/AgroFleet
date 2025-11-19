-- Insert sample employees
INSERT INTO employees (email, full_name, department, phone, is_admin) VALUES
  ('admin@empresa.com', 'Administrador Principal', 'Administración', '+34 600 000 001', true),
  ('juan.perez@empresa.com', 'Juan Pérez García', 'Ventas', '+34 600 000 002', false),
  ('maria.lopez@empresa.com', 'María López Martínez', 'Marketing', '+34 600 000 003', false),
  ('carlos.ruiz@empresa.com', 'Carlos Ruiz Sánchez', 'Logística', '+34 600 000 004', false),
  ('ana.garcia@empresa.com', 'Ana García Fernández', 'Recursos Humanos', '+34 600 000 005', false)
ON CONFLICT (email) DO NOTHING;

-- Insert sample vehicles
INSERT INTO vehicles (license_plate, brand, model, year, color, vehicle_type, fuel_type, seats, status) VALUES
  ('1234ABC', 'Seat', 'León', 2022, 'Blanco', 'car', 'gasoline', 5, 'available'),
  ('5678DEF', 'Volkswagen', 'Transporter', 2021, 'Gris', 'van', 'diesel', 9, 'available'),
  ('9012GHI', 'Ford', 'Transit', 2023, 'Azul', 'van', 'diesel', 7, 'available'),
  ('3456JKL', 'Toyota', 'Corolla', 2022, 'Negro', 'car', 'hybrid', 5, 'available'),
  ('7890MNO', 'Renault', 'Clio', 2020, 'Rojo', 'car', 'gasoline', 5, 'available'),
  ('2468PQR', 'Mercedes-Benz', 'Sprinter', 2023, 'Blanco', 'van', 'diesel', 12, 'available'),
  ('1357STU', 'Peugeot', '308', 2021, 'Gris', 'car', 'diesel', 5, 'available'),
  ('9753VWX', 'Nissan', 'Qashqai', 2022, 'Azul', 'car', 'gasoline', 5, 'available')
ON CONFLICT (license_plate) DO NOTHING;

-- Insert sample maintenance records
INSERT INTO maintenance (vehicle_id, maintenance_type, scheduled_date, description, status)
SELECT 
  v.id,
  'itv',
  NOW() + INTERVAL '30 days',
  'Inspección Técnica de Vehículos anual',
  'scheduled'
FROM vehicles v
WHERE v.license_plate = '1234ABC';

INSERT INTO maintenance (vehicle_id, maintenance_type, scheduled_date, description, status)
SELECT 
  v.id,
  'workshop',
  NOW() + INTERVAL '15 days',
  'Revisión de frenos y cambio de aceite',
  'scheduled'
FROM vehicles v
WHERE v.license_plate = '5678DEF';
