import { MaintenanceList } from "@/components/maintenance/maintenance-list";

export default function AdminMaintenancePage() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Mantenimiento</h1>
        <p className="text-muted-foreground mt-1">
          Programa y gestiona ITV, talleres y reparaciones de los vehículos.
        </p>
      </div>
      <MaintenanceList />
    </div>
  );
}
