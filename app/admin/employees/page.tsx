import { EmployeesList } from "@/components/employees/employees-list"

export default function AdminEmployeesPage() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Empleados</h1>
        <p className="text-muted-foreground mt-1">Administra los empleados y sus permisos</p>
      </div>
      <EmployeesList />
    </div>
  )
}
