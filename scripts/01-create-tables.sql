-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate TEXT UNIQUE NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  vehicle_type TEXT NOT NULL, -- 'car', 'van', 'truck', etc.
  status TEXT DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'unavailable'
  current_location_lat DECIMAL(10, 8),
  current_location_lng DECIMAL(11, 8),
  last_location_update TIMESTAMPTZ,
  fuel_type TEXT, -- 'gasoline', 'diesel', 'electric', 'hybrid'
  seats INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  purpose TEXT NOT NULL, -- justification for the booking
  destination TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create maintenance table
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL, -- 'itv', 'workshop', 'repair', 'service'
  scheduled_date TIMESTAMPTZ NOT NULL,
  completed_date TIMESTAMPTZ,
  description TEXT NOT NULL,
  cost DECIMAL(10, 2),
  workshop_name TEXT,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fines table
CREATE TABLE IF NOT EXISTS fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  fine_date TIMESTAMPTZ NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'appealed'
  identified_automatically BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_id ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_employee_id ON bookings(employee_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_fines_vehicle_id ON fines(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fines_fine_date ON fines(fine_date);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
