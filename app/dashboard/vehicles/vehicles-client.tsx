"use client"

import { useMemo, useState } from "react"
import { NewEmployeeBookingDialog } from "@/components/employee/new-employee-booking-dialog";

import { Search } from "lucide-react"

type Vehicle = {
  id: string
  license_plate: string
  brand: string
  model: string
  year: number | null
  status: string
}

export function EmployeeVehiclesClient({ vehicles }: { vehicles: Vehicle[] }) {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  const filteredVehicles = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return vehicles

    return vehicles.filter((v) => {
      const text = `${v.license_plate} ${v.brand} ${v.model}`.toLowerCase()
      return text.includes(term)
    })
  }, [vehicles, search])

  const handleClickVehicle = (id: string) => {
    setSelectedVehicleId(id)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="h-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Vehículos disponibles
            </h1>
            <p className="text-sm text-muted-foreground">
              Administra la flota de vehículos.
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="flex items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm"
              placeholder="Buscar por matrícula, marca o modelo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid de vehículos (igual estilo admin) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVehicles.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => handleClickVehicle(v.id)}
              className="group flex flex-col rounded-2xl border bg-card p-4 text-left shadow-sm hover:shadow-md transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="flex items-start gap-3">
                {/* Icono coche, como en admin */}
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary text-lg">
                  🚗
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm">
                      {v.license_plate}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                      Disponible
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.brand} {v.model}
                  </p>
                  {v.year && (
                    <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
                      <span>📅</span>Año {v.year}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}

          {filteredVehicles.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-12 text-sm text-muted-foreground">
              No hay vehículos que coincidan con la búsqueda.
            </div>
          )}
        </div>
      </div>

      {/* Modal de nueva reserva */}
      <NewEmployeeBookingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vehicles={vehicles}
        initialVehicleId={selectedVehicleId}
      />
    </>
  )
}
