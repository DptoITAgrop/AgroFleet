-- Enable Row Level Security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fines ENABLE ROW LEVEL SECURITY;

-- Policies for employees table
CREATE POLICY "Employees can view all employees"
  ON employees FOR SELECT
  USING (true);

CREATE POLICY "Only admins can insert employees"
  ON employees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update employees"
  ON employees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policies for vehicles table
CREATE POLICY "Everyone can view vehicles"
  ON vehicles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage vehicles"
  ON vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policies for bookings table
CREATE POLICY "Employees can view their own bookings"
  ON bookings FOR SELECT
  USING (
    employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Employees can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Employees can update their own bookings"
  ON bookings FOR UPDATE
  USING (
    employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policies for maintenance table
CREATE POLICY "Everyone can view maintenance"
  ON maintenance FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage maintenance"
  ON maintenance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Policies for fines table
CREATE POLICY "Admins can view all fines, employees can view their own"
  ON fines FOR SELECT
  USING (
    employee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can manage fines"
  ON fines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid() AND is_admin = true
    )
  );
