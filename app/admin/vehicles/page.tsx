import { VehicleList } from "@/components/vehicles/vehicle-list"

export default function AdminVehiclesPage() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Vehículos</h1>
        <p className="text-muted-foreground mt-1">Administra la flota de vehículos</p>
      </div>
      <VehicleList isAdmin={true} />
    </div>
  )
}
