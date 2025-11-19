"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
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
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select"

// ====================
// Tipos
// ====================

type Vehicle = {
  id: string
  license_plate: string
  brand: string
  model: string
  year: number | null
}

type Booking = {
  id: string
  vehicle_id: string
  start_date: string
  end_date: string
  purpose: string | null
  destination: string | null
  status: string
  vehicle?: Vehicle
}

// ====================
// Componente principal
// ====================

export default function EmployeeBookingsPage() {
  const supabase = getSupabaseBrowserClient()

  const [bookings, setBookings] = useState<Booking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // estado del formulario
  const [vehicleId, setVehicleId] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [purpose, setPurpose] = useState<string>("")
  const [destination, setDestination] = useState<string>("")

  // ==========
  // Carga datos
  // ==========

  // Reservas del empleado (la API ya filtra por el usuario autenticado)
  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true)
        const res = await fetch("/api/bookings")
        if (!res.ok) {
          console.error("Error fetching bookings", await res.text())
          throw new Error("No se han podido cargar las reservas")
        }
        const data = await res.json()
        setBookings(data ?? [])
      } catch (e: any) {
        setError(e?.message || "Error cargando reservas")
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [])

  // Vehículos disponibles (leemos directamente de Supabase en el cliente)
  useEffect(() => {
    const loadVehicles = async () => {
      const { data, error } = await supabase
        .from("vehiculos")
        .select("id, license_plate, brand, model, year, status")
        .eq("status", "available")
        .order("license_plate", { ascending: true })

      if (!error && data) {
        setVehicles(
          data.map((v) => ({
            id: v.id,
            license_plate: v.license_plate,
            brand: v.brand,
            model: v.model,
            year: v.year,
          }))
        )
      }
    }

    loadVehicles()
  }, [supabase])

  // ==========
  // Crear reserva
  // ==========

  const resetForm = () => {
    setVehicleId("")
    setStartDate("")
    setEndDate("")
    setPurpose("")
    setDestination("")
  }

  const handleCreateBooking = async () => {
    try {
      if (!vehicleId || !startDate || !endDate) {
        alert("Vehículo, fecha de inicio y fecha de fin son obligatorios")
        return
      }

      setSaving(true)

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          employee_id: "me", // el endpoint usa el usuario autenticado
          start_date: startDate,
          end_date: endDate,
          purpose: purpose || null,
          destination: destination || null,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Error creando la reserva")
      }

      const created = (await res.json()) as Booking
      setBookings((prev) => [created, ...prev])

      setDialogOpen(false)
      resetForm()
    } catch (e: any) {
      alert(e?.message || "Error creando la reserva")
    } finally {
      setSaving(false)
    }
  }

  // ==========
  // Render
  // ==========

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Cabecera, igual estilo que admin */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Mis reservas
          </h1>
          <p className="text-sm text-muted-foreground">
            Visualiza y gestiona tus reservas de vehículos.
          </p>
        </div>

        <Button onClick={() => setDialogOpen(true)}>Nueva reserva</Button>
      </div>

      {/* Lista de reservas */}
      <section className="bg-card border rounded-xl p-4 sm:p-6 min-h-[200px]">
        {loading && (
          <p className="text-sm text-muted-foreground">
            Cargando reservas…
          </p>
        )}

        {error && !loading && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {!loading && !error && bookings.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No tienes reservas todavía.
          </p>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="space-y-3">
            {bookings.map((b) => {
              const v = b.vehicle
              const title = v
                ? `${v.license_plate} – ${v.brand} ${v.model}${
                    v.year ? ` (${v.year})` : ""
                  }`
                : b.vehicle_id

              return (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(b.start_date), "Pp", { locale: es })} —{" "}
                      {format(new Date(b.end_date), "Pp", { locale: es })}
                    </p>
                    {b.destination && (
                      <p className="text-xs text-muted-foreground">
                        Destino: {b.destination}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : b.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Diálogo Nueva reserva (mismo estilo que admin) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva reserva</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Vehículo</label>
              <Select
                value={vehicleId}
                onValueChange={(v) => setVehicleId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.license_plate} – {v.brand} {v.model}
                      {v.year ? ` (${v.year})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Fecha de inicio</label>
                <Input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Fecha de fin</label>
                <Input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Justificación del uso
              </label>
              <Textarea
                rows={3}
                placeholder="Describe el motivo de la reserva…"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Destino</label>
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
              onClick={() => {
                setDialogOpen(false)
                resetForm()
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateBooking} disabled={saving}>
              {saving ? "Guardando..." : "Reservar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
