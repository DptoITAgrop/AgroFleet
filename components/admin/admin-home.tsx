// components/admin/admin-home.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

type UpcomingRow = {
  id: string
  start_date: string
  end_date: string
  status: string
  employee?: { id: string; full_name?: string | null; email?: string | null }
  vehicle?: { id: string; license_plate?: string | null; brand?: string | null; model?: string | null; year?: number | null }
}

type Overview = {
  metrics: { activeCount: number; availableVehicles: number }
  upcoming: UpcomingRow[]
}

export default function AdminHome({ initialOverview }: { initialOverview: Overview }) {
  const [data, setData] = useState<Overview>(initialOverview)
  const supabase = useMemo(() => createClient(), [])

  const refetch = async () => {
    const res = await fetch("/api/admin/overview", { cache: "no-store" })
    if (res.ok) setData(await res.json())
  }

  useEffect(() => {
    const ch = supabase
      .channel("admin-overview-reservas")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservas" }, () => {
        refetch()
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [supabase])

  const { metrics, upcoming } = data

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Reservas Activas</div>
          <div className="text-3xl font-bold">{metrics.activeCount}</div>
          <div className="text-xs text-muted-foreground mt-1">En uso actualmente</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Vehículos Disponibles</div>
          <div className="text-3xl font-bold">{metrics.availableVehicles}</div>
          <div className="text-xs text-muted-foreground mt-1">Listos para reservar</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Próximas Reservas</div>
          <div className="text-3xl font-bold">{upcoming.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Programadas</div>
        </div>
      </div>

      {/* Próximas reservas */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Próximas Reservas</h2>
          <Button variant="ghost" onClick={refetch}>Refrescar</Button>
        </div>

        {upcoming.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay reservas programadas</div>
        ) : (
          <ul className="divide-y">
            {upcoming.map((r) => (
              <li key={r.id} className="py-3 flex items-start gap-3">
                <div className="flex-1">
                  <div className="font-medium">
                    {r.vehicle?.license_plate} — {r.vehicle?.brand} {r.vehicle?.model} {r.vehicle?.year ? `(${r.vehicle.year})` : ""}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(r.start_date).toLocaleString()} → {new Date(r.end_date).toLocaleString()}
                  </div>
                </div>
                <div className="w-64 text-right">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Empleado:&nbsp;</span>
                    {r.employee?.full_name || r.employee?.email || r.employee?.id}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.status}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
