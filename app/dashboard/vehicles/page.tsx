// app/dashboard/vehicles/page.tsx
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { EmployeeVehiclesClient } from "./vehicles-client.tsx"

export const dynamic = "force-dynamic"

export default async function EmployeeVehiclesPage() {
  const supabase = await getSupabaseServerClient()

  const { data: vehicles, error } = await supabase
    .from("vehiculos")
    .select("id, license_plate, brand, model, year, status")
    .order("license_plate", { ascending: true })

  if (error) {
    console.error("Error fetching vehicles for employee", error)
  }

  // Sólo mostramos disponibles
  const availableVehicles = (vehicles ?? []).filter(
    (v) => v.status === "available"
  )

  return <EmployeeVehiclesClient vehicles={availableVehicles} />
}
