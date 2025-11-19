// app/admin/fines/page.tsx
import { FinesList } from "@/components/admin/admin-fines-list"

export default function AdminFinesPage() {
  return (
    <div className="p-8 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Multas</h1>
        <p className="text-muted-foreground mt-1">
          Registra multas e identifica conductores responsables.
        </p>
      </div>
      <FinesList />
    </div>
  )
}
