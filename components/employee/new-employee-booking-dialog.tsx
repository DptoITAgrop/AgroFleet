// new.employee-booking-dialog.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type Vehicle = {
  id: string
  license_plate: string
  brand: string
  model: string
  year: number | null
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: Vehicle[]
  initialVehicleId?: string | null
  onCreated?: () => void
}

type AvailabilityState =
  | "idle"
  | "checking"
  | "available"
  | "conflict"
  | "maintenance"
  | "error"

export function NewEmployeeBookingDialog({
  open,
  onOpenChange,
  vehicles,
  initialVehicleId,
  onCreated,
}: Props) {
  const [vehicleId, setVehicleId] = useState<string>("")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [purpose, setPurpose] = useState("")
  const [destination, setDestination] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [availabilityState, setAvailabilityState] =
    useState<AvailabilityState>("idle")
  const [availabilityMsg, setAvailabilityMsg] = useState<string>("")

  useEffect(() => {
    if (open && initialVehicleId) {
      setVehicleId(initialVehicleId)
    }
  }, [open, initialVehicleId])

  useEffect(() => {
    if (!open) {
      setStartDate("")
      setEndDate("")
      setPurpose("")
      setDestination("")
      setAvailabilityState("idle")
      setAvailabilityMsg("")
    }
  }, [open])

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === vehicleId),
    [vehicles, vehicleId]
  )

  // --- comprobación de disponibilidad (como ya la tienes) ---
  useEffect(() => {
    if (!vehicleId || !startDate || !endDate) {
      setAvailabilityState("idle")
      setAvailabilityMsg("")
      return
    }

    let cancelled = false

    const check = async () => {
      try {
        setAvailabilityState("checking")
        setAvailabilityMsg("Comprobando disponibilidad...")

        const params = new URLSearchParams({
          vehicle_id: vehicleId,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
        })

        const res = await fetch(`/api/bookings/availability?${params.toString()}`)

        if (!res.ok) {
          const text = await res.text()
          console.error("availability error", text)
          if (cancelled) return
          setAvailabilityState("error")
          setAvailabilityMsg("No se ha podido comprobar la disponibilidad.")
          return
        }

        const json = await res.json()
        if (cancelled) return

        if (json.available) {
          setAvailabilityState("available")
          setAvailabilityMsg(
            json.message || "Vehículo disponible para las fechas seleccionadas."
          )
        } else if (json.reason === "maintenance") {
          setAvailabilityState("maintenance")
          setAvailabilityMsg(
            json.message || "El vehículo está en el taller en esas fechas."
          )
        } else if (json.reason === "booking_conflict") {
          setAvailabilityState("conflict")
          setAvailabilityMsg(
            json.message || "Esta fecha tiene otra reserva para este vehículo."
          )
        } else {
          setAvailabilityState("error")
          setAvailabilityMsg(json.message || "No se ha podido comprobar la disponibilidad.")
        }
      } catch (err) {
        console.error(err)
        if (cancelled) return
        setAvailabilityState("error")
        setAvailabilityMsg("No se ha podido comprobar la disponibilidad.")
      }
    }

    check()
    return () => { cancelled = true }
  }, [vehicleId, startDate, endDate])

  // ------- 🔧 AQUÍ ESTABA EL FALLO -------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vehicleId || !startDate || !endDate) return

    // Bloqueamos si sabemos que NO está disponible
    if (availabilityState === "conflict" || availabilityState === "maintenance") {
      alert(availabilityMsg || "El vehículo no está disponible en esas fechas.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          // usamos las variables correctas y en ISO
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          purpose: purpose || null,
          destination: destination || null,
        }),
      })

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Error creando reserva" }))
        alert(error || "Error creando reserva")
        return
      }

      onOpenChange(false)
      onCreated?.()
    } finally {
      setSubmitting(false)
    }
  }
  // ---------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nueva reserva</DialogTitle>
        </DialogHeader>

        <form className="space-y-6 mt-2" onSubmit={handleSubmit}>
          {/* Vehículo */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Vehículo</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">Selecciona un vehículo</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate} – {v.brand} {v.model}{" "}
                  {v.year ? `(${v.year})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Fecha de inicio</label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium">Fecha de fin</label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Mensaje de disponibilidad */}
          {availabilityState !== "idle" && (
            <div
              className={
                availabilityState === "available"
                  ? "rounded-md bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-800 flex items-center gap-2"
                  : availabilityState === "checking"
                  ? "rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 flex items-center gap-2"
                  : "rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 flex items-center gap-2"
              }
            >
              {availabilityMsg}
            </div>
          )}

          {/* Justificación */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Justificación del uso</label>
            <Textarea
              placeholder="Describe el motivo de la reserva..."
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>

          {/* Destino */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Destino</label>
            <Input
              placeholder="Ej. Madrid, Barcelona..."
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                submitting ||
                availabilityState === "checking" ||
                availabilityState === "conflict" ||
                availabilityState === "maintenance"
              }
            >
              Reservar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
