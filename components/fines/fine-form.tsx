"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"
import type { Vehicle, Fine, Employee } from "@/lib/types"

interface FineFormProps {
  fine?: Fine
  onSubmit: (data: Partial<Fine>) => Promise<void>
  onCancel: () => void
}

export function FineForm({ fine, onSubmit, onCancel }: FineFormProps) {
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [identifiedEmployee, setIdentifiedEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState({
    vehicle_id: fine?.vehicle_id || "",
    fine_date: fine?.fine_date ? new Date(fine.fine_date).toISOString().slice(0, 16) : "",
    amount: fine?.amount || "",
    description: fine?.description || "",
    location: fine?.location || "",
    status: fine?.status || "pending",
    notes: fine?.notes || "",
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    if (formData.vehicle_id && formData.fine_date && !fine) {
      identifyEmployee()
    }
  }, [formData.vehicle_id, formData.fine_date])

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/vehicles")
      const data = await response.json()
      setVehicles(data)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    }
  }

  const identifyEmployee = async () => {
    try {
      const response = await fetch("/api/fines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: formData.vehicle_id,
          fine_date: new Date(formData.fine_date).toISOString(),
          amount: 0,
          description: "temp",
        }),
      })

      const data = await response.json()
      if (data.employee) {
        setIdentifiedEmployee(data.employee)
      }
    } catch (error) {
      console.error("Error identifying employee:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        fine_date: new Date(formData.fine_date).toISOString(),
        amount: Number.parseFloat(formData.amount.toString()),
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vehicle_id">Vehículo</Label>
        <Select
          value={formData.vehicle_id}
          onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}
          disabled={!!fine}
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fine_date">Fecha de la multa</Label>
          <Input
            id="fine_date"
            type="datetime-local"
            value={formData.fine_date}
            onChange={(e) => setFormData({ ...formData, fine_date: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Importe (€)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      {identifiedEmployee && !fine && (
        <Alert className="border-green-500/20 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Conductor identificado automáticamente: <strong>{identifiedEmployee.full_name}</strong>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe la infracción..."
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Ubicación</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Ej: Calle Mayor, Madrid"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Estado</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="paid">Pagada</SelectItem>
            <SelectItem value="appealed">Recurrida</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas adicionales</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : fine ? "Actualizar" : "Registrar"}
        </Button>
      </div>
    </form>
  )
}
