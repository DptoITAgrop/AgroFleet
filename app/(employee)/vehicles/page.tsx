// app/vehicles/page.tsx
"use client"

import { useEffect, useState, useRef } from "react"
import { Plus, Car as CarIcon, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert"

type Vehicle = {
  id: string
  license_plate: string
  brand: string
  model: string
  year: number
  status: "available" | "maintenance" | "in_use" | string
}

export default function EmployeeVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch("/api/vehicles")
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setVehicles(data ?? [])
      } catch (e: any) {
        console.error(e)
        setError("Error cargando vehículos")
      } finally {
        setLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="px-4 py-6 lg:px-8 lg:py-8">
        <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Gestión de Vehículos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Administra la flota de vehículos disponible para reservas.
            </p>
          </div>

          {/* Botón sólo informativo para empleados, sin acción */}
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2 cursor-default"
          >
            <Plus className="w-4 h-4" />
            Añadir vehículo
          </Button>
        </div>

        {/* Barra de búsqueda “dummy” para mantener el mismo layout que admin */}
        <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <input
              type="text"
              placeholder="Buscar por matrícula, marca o modelo…"
              className="w-full px-3 py-2 text-sm border rounded-md bg-white/80 border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              disabled
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              className="px-3 py-2 text-sm border rounded-md bg-white/80 border-slate-200"
              disabled
            >
              <option>Todos los estados</option>
            </select>
          </div>
        </div>

        {loading && (
          <p className="mt-10 text-sm text-center text-slate-500">
            Cargando vehículos…
          </p>
        )}

        {error && !loading && (
          <p className="mt-10 text-sm text-center text-red-500">{error}</p>
        )}

        {!loading && !error && vehicles.length === 0 && (
          <p className="mt-10 text-sm text-center text-slate-500">
            No hay vehículos registrados.
          </p>
        )}

        {!loading && !error && vehicles.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {vehicles.map((v) => {
              const isAvailable = v.status === "available"

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => isAvailable && setSelectedVehicle(v)}
                  className={`flex flex-col justify-between overflow-hidden rounded-2xl border bg-white/80 text-left shadow-sm transition hover:shadow-md ${
                    !isAvailable
                      ? "opacity-70 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-start gap-4 p-4 pb-3">
                    <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-50">
                      <CarIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-slate-400">
                        {v.license_plate}
                      </p>
                      <h3 className="text-base font-semibold text-slate-900">
                        {v.brand} {v.model}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">Año {v.year}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-slate-100">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        isAvailable
                          ? "bg-emerald-50 text-emerald-700"
                          : v.status === "maintenance"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isAvailable
                        ? "Disponible"
                        : v.status === "maintenance"
                        ? "En mantenimiento"
                        : "No disponible"}
                    </span>
                    {isAvailable && (
                      <span className="text-xs font-medium text-emerald-600">
                        Reservar
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {selectedVehicle && (
          <NewEmployeeBookingDialog
            vehicle={selectedVehicle}
            open={!!selectedVehicle}
            onOpenChange={(open) => !open && setSelectedVehicle(null)}
          />
        )}
      </main>
    </div>
  )
}

// ======================================
// Diálogo de nueva reserva para empleado
// ======================================

interface NewEmployeeBookingDialogProps {
  vehicle: Vehicle
  open: boolean
  onOpenChange: (open: boolean) => void
}

function NewEmployeeBookingDialog({
  vehicle,
  open,
  onOpenChange,
}: NewEmployeeBookingDialogProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [purpose, setPurpose] = useState("")
  const [destination, setDestination] = useState("")
  const [saving, setSaving] = useState(false)

  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availabilityStatus, setAvailabilityStatus] = useState<
    "available" | "unavailable" | null
  >(null)
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(
    null,
  )
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset cuando se abre/cierra
  useEffect(() => {
    if (open) {
      setStartDate("")
      setEndDate("")
      setPurpose("")
      setDestination("")
      setAvailabilityStatus(null)
      setAvailabilityMessage(null)
    }
  }, [open])

  // Comprobar disponibilidad con debounce
  useEffect(() => {
    if (!startDate || !endDate || !vehicle?.id) {
      setAvailabilityStatus(null)
      setAvailabilityMessage(null)
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      checkAvailability().catch((e) => {
        console.error(e)
      })
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, vehicle?.id])

  const checkAvailability = async () => {
    try {
      setCheckingAvailability(true)
      setAvailabilityMessage(null)

      const res = await fetch("/api/bookings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          start: new Date(startDate).toISOString(),
          end: new Date(endDate).toISOString(),
          excludeBookingId: null,
        }),
      })

      const json = await res.json().catch(() => ({} as any))

      if (!res.ok) {
        setAvailabilityStatus("unavailable")
        setAvailabilityMessage(
          typeof json?.error === "string"
            ? json.error
            : "Error verificando disponibilidad",
        )
        return
      }

      setAvailabilityStatus(json.available ? "available" : "unavailable")
      setAvailabilityMessage(json.message ?? null)
    } catch (e) {
      console.error("Error checking availability", e)
      setAvailabilityStatus("unavailable")
      setAvailabilityMessage("No se pudo verificar la disponibilidad")
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleReserve = async () => {
    try {
      if (!vehicle?.id || !startDate || !endDate) return
      if (availabilityStatus === "unavailable") return

      setSaving(true)

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: vehicle.id,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          purpose: purpose || null,
          destination: destination || null,
        }),
      })

      const body = await res.json().catch(() => ({} as any))

      if (!res.ok) {
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "Error creando la reserva",
        )
      }

      // éxito
      onOpenChange(false)
    } catch (e: any) {
      alert(e?.message || "Error creando la reserva")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Vehículo</Label>
            <p className="text-sm font-semibold">
              {vehicle.license_plate} – {vehicle.brand} {vehicle.model} (Año{" "}
              {vehicle.year})
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Fecha de inicio</Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-medium">Fecha de fin</Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {checkingAvailability && (
            <Alert>
              <AlertDescription>Verificando disponibilidad…</AlertDescription>
            </Alert>
          )}

          {!checkingAvailability && availabilityStatus === "available" && (
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                {availabilityMessage ??
                  "Vehículo disponible para las fechas seleccionadas."}
              </AlertDescription>
            </Alert>
          )}

          {!checkingAvailability && availabilityStatus === "unavailable" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {availabilityMessage ??
                  "Vehículo no disponible para las fechas seleccionadas."}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            <Label className="text-sm font-medium">Justificación del uso</Label>
            <Textarea
              rows={3}
              placeholder="Describe el motivo de la reserva…"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-sm font-medium">Destino</Label>
            <Input
              placeholder="Ej. Madrid, Barcelona…"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReserve}
            disabled={
              saving ||
              !startDate ||
              !endDate ||
              availabilityStatus === "unavailable"
            }
          >
            {saving ? "Guardando..." : "Reservar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
