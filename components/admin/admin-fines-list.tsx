// components/admin/fines-list.tsx
"use client"

import { useEffect, useState } from "react"
import type { Fine } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectTrigger, SelectContent, SelectValue, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export function FinesList() {
  const [fines, setFines] = useState<Fine[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fetchFines = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      const res = await fetch("/api/fines", { cache: "no-store" })
      if (!res.ok) throw new Error(await res.text())

      const body = await res.json()
      const data = Array.isArray(body) ? body : body?.fines

      setFines(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Error fetching fines:", e)
      setErrorMsg("No se pudieron cargar las multas.")
      setFines([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFines()
  }, [])

  const filteredFines = (Array.isArray(fines) ? fines : []).filter((fine) =>
    statusFilter === "all" ? true : fine.status === statusFilter,
  )

  if (loading) {
    return <div className="py-8 text-center">Cargando multas...</div>
  }

  if (errorMsg) {
    return (
      <div className="py-8 text-center">
        <p className="text-red-600 mb-3">{errorMsg}</p>
        <Button onClick={fetchFines}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={fetchFines}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
            <SelectItem value="paid">Pagadas</SelectItem>
            <SelectItem value="cancelled">Anuladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredFines.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">No hay multas con el filtro seleccionado</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFines.map((fine) => (
            <Card key={fine.id} className="p-4 space-y-2">
              <div className="flex justify-between items-center">
                <div className="font-semibold">
                  {fine.vehicle?.license_plate ?? "Vehículo"} · {fine.amount.toFixed(2)} €
                </div>
                <Badge
                  variant={
                    fine.status === "pending"
                      ? "destructive"
                      : fine.status === "paid"
                      ? "default"
                      : "outline"
                  }
                >
                  {fine.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Fecha: {new Date(fine.fine_date).toLocaleDateString()}
              </div>
              {fine.employee && (
                <div className="text-xs text-muted-foreground">
                  Conductor: {fine.employee.full_name} ({fine.employee.email})
                </div>
              )}
              {fine.notes && <div className="text-sm">{fine.notes}</div>}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
