-- Function to automatically identify employee for a fine based on vehicle and date
CREATE OR REPLACE FUNCTION identify_employee_for_fine(
  p_vehicle_id UUID,
  p_fine_date TIMESTAMPTZ
)
RETURNS TABLE(
  employee_id UUID,
  employee_name TEXT,
  booking_id UUID,
  booking_start TIMESTAMPTZ,
  booking_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.employee_id,
    e.full_name,
    b.id,
    b.start_date,
    b.end_date
  FROM bookings b
  JOIN employees e ON b.employee_id = e.id
  WHERE b.vehicle_id = p_vehicle_id
    AND b.status = 'active'
    AND p_fine_date BETWEEN b.start_date AND b.end_date
  ORDER BY b.start_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check vehicle availability
CREATE OR REPLACE FUNCTION check_vehicle_availability(
  p_vehicle_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  booking_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO booking_count
  FROM bookings
  WHERE vehicle_id = p_vehicle_id
    AND status = 'active'
    AND (
      (start_date <= p_start_date AND end_date >= p_start_date)
      OR (start_date <= p_end_date AND end_date >= p_end_date)
      OR (start_date >= p_start_date AND end_date <= p_end_date)
    );
  
  RETURN booking_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to update vehicle status based on bookings
CREATE OR REPLACE FUNCTION update_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If a new booking is created or updated to active
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status = 'active' THEN
    IF NOW() BETWEEN NEW.start_date AND NEW.end_date THEN
      UPDATE vehicles SET status = 'in_use' WHERE id = NEW.vehicle_id;
    END IF;
  END IF;
  
  -- If a booking is completed or cancelled
  IF (TG_OP = 'UPDATE') AND (NEW.status = 'completed' OR NEW.status = 'cancelled') THEN
    -- Check if there are other active bookings for this vehicle
    IF NOT EXISTS (
      SELECT 1 FROM bookings 
      WHERE vehicle_id = NEW.vehicle_id 
        AND status = 'active' 
        AND NOW() BETWEEN start_date AND end_date
    ) THEN
      UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic vehicle status updates
DROP TRIGGER IF EXISTS trigger_update_vehicle_status ON bookings;
CREATE TRIGGER trigger_update_vehicle_status
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_status();
