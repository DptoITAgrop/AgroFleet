// components/bookings/booking-form.tsx
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { Vehicle, Booking } from "@/lib/types"

interface BookingFormProps {
  booking?: Booking
  employeeId: string
  onSubmit: (data: Partial<Booking>) => Promise<void>
  onCancel: () => void
}

export function BookingForm({
  booking,
  employeeId,
  onSubmit,
  onCancel,
}: BookingFormProps) {
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [availabilityStatus, setAvailabilityStatus] =
    useState<"available" | "unavailable" | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [formData, setFormData] = useState({
    vehicle_id: booking?.vehicle_id || "",
    employee_id: employeeId,
    start_date: booking?.start_date
      ? new Date(booking.start_date).toISOString().slice(0, 16)
      : "",
    end_date: booking?.end_date
      ? new Date(booking.end_date).toISOString().slice(0, 16)
      : "",
    purpose: booking?.purpose || "",
    destination: booking?.destination || "",
    status: booking?.status || "active",
  })

  // =======================
  // Carga de vehículos
  // =======================
  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/vehicles")
      const data = await response.json()
      setVehicles(
        data.filter(
          (v: Vehicle) =>
            v.status === "available" || v.id === booking?.vehicle_id
        )
      )
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    }
  }

  // =======================
  // Comprobación automática (debounce)
  // =======================
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      if (formData.vehicle_id && formData.start_date && formData.end_date) {
        checkAvailability()
      } else {
        setAvailabilityStatus(null)
        setErrorMsg(null)
      }
    }, 250)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.vehicle_id, formData.start_date, formData.end_date])

  // =======================
  // checkAvailability
  // =======================
  const checkAvailability = async () => {
    try {
      if (!formData.vehicle_id || !formData.start_date || !formData.end_date) {
        setAvailabilityStatus(null)
        setErrorMsg(null)
        return
      }

      setCheckingAvailability(true)
      setErrorMsg(null)

      const startIso = new Date(formData.start_date).toISOString()
      const endIso = new Date(formData.end_date).toISOString()

      const res = await fetch("/api/bookings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 👇 nombres que espera el endpoint
          vehicle_id: formData.vehicle_id,
          start_date: startIso,
          end_date: endIso,
        }),
      })

      const json = await res.json().catch(() => ({} as any))

      if (!res.ok) {
        // errores 4xx/5xx → lo tratamos como no disponible con mensaje
        setAvailabilityStatus("unavailable")
        setErrorMsg(
          typeof json?.message === "string"
            ? json.message
            : typeof json?.error === "string"
            ? json.error
            : "Error verificando disponibilidad"
        )
        return
      }

      if (json.available) {
        setAvailabilityStatus("available")
        setErrorMsg(null)
      } else {
        setAvailabilityStatus("unavailable")
        setErrorMsg(
          typeof json?.message === "string"
            ? json.message
            : "Vehículo no disponible para las fechas seleccionadas"
        )
      }
    } catch (error) {
      console.error("Error checking availability:", error)
      setAvailabilityStatus("unavailable")
      setErrorMsg("No se pudo verificar la disponibilidad")
    } finally {
      setCheckingAvailability(false)
    }
  }

  // =======================
  // handleSubmit
  // =======================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Si es nueva reserva y sabemos que está no disponible, no dejamos continuar
    if (availabilityStatus === "unavailable" && !booking) return

    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }

  // =======================
  // Render
  // =======================
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Vehículo */}
      <div className="space-y-2">
        <Label htmlFor="vehicle_id">Vehículo</Label>
        <Select
          value={formData.vehicle_id}
          onValueChange={(value) =>
            setFormData({ ...formData, vehicle_id: value })
          }
          disabled={!!booking}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un vehículo" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.license_plate} - {vehicle.brand} {vehicle.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Fecha de inicio</Label>
          <Input
            id="start_date"
            type="datetime-local"
            value={formData.start_date}
            onChange={(e) =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Fecha de fin</Label>
          <Input
            id="end_date"
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            required
          />
        </div>
      </div>

      {/* Mensajes de disponibilidad */}
      {checkingAvailability && (
        <Alert>
          <AlertDescription>Verificando disponibilidad...</AlertDescription>
        </Alert>
      )}

      {!checkingAvailability && availabilityStatus === "available" && (
        <Alert className="border-green-500/20 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Vehículo disponible para las fechas seleccionadas
          </AlertDescription>
        </Alert>
      )}

      {!checkingAvailability &&
        availabilityStatus === "unavailable" &&
        !booking && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMsg ??
                "Vehículo no disponible para las fechas seleccionadas"}
            </AlertDescription>
          </Alert>
        )}

      {/* Justificación */}
      <div className="space-y-2">
        <Label htmlFor="purpose">Justificación del uso</Label>
        <Textarea
          id="purpose"
          value={formData.purpose}
          onChange={(e) =>
            setFormData({ ...formData, purpose: e.target.value })
          }
          placeholder="Describe el motivo de la reserva..."
          rows={3}
          required
        />
      </div>

      {/* Destino */}
      <div className="space-y-2">
        <Label htmlFor="destination">Destino</Label>
        <Input
          id="destination"
          value={formData.destination}
          onChange={(e) =>
            setFormData({ ...formData, destination: e.target.value })
          }
          placeholder="Ej: Madrid, Barcelona..."
        />
      </div>

      {/* Estado (solo edición) */}
      {booking && (
        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activa</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={
            loading || (availabilityStatus === "unavailable" && !booking)
          }
        >
          {loading ? "Guardando..." : booking ? "Actualizar" : "Reservar"}
        </Button>
      </div>
    </form>
  )
}
