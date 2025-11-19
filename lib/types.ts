export interface Employee {
  id: string
  email: string
  full_name: string
  department: string | null
  phone: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Vehicle {
  id: string
  license_plate: string
  brand: string
  model: string
  year: number
  color: string | null
  vehicle_type: "car" | "van" | "truck" | "tractor" | "trailer" | "machinery"
  status: "available" | "in_use" | "maintenance" | "unavailable"
  current_location_lat: number | null
  current_location_lng: number | null
  last_location_update: string | null
  fuel_type: string | null
  seats: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  vehicle_id: string
  employee_id: string
  start_date: string
  end_date: string
  purpose: string
  destination: string | null
  status: "active" | "completed" | "cancelled"
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  employee?: Employee
}

export interface Maintenance {
  id: string
  vehicle_id: string
  maintenance_type: "itv" | "workshop" | "repair" | "service"
  scheduled_date: string
  completed_date: string | null
  description: string
  cost: number | null
  workshop_name: string | null
  status: "scheduled" | "in_progress" | "completed"
  notes: string | null
  created_at: string
  updated_at: string
  vehicle?: Vehicle
}

export interface Fine {
  id: string
  vehicle_id: string
  employee_id: string | null
  booking_id: string | null
  fine_date: string
  amount: number
  description: string
  location: string | null
  status: "pending" | "paid" | "appealed"
  identified_automatically: boolean
  notes: string | null
  created_at: string
  updated_at: string
  vehicle?: Vehicle
  employee?: Employee
  booking?: Booking
}

