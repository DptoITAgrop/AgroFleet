"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Vehicle, Maintenance } from "@/lib/types"

interface MaintenanceFormProps {
  maintenance?: Maintenance
  onSubmit: (data: Partial<Maintenance>) => Promise<void>
  onCancel: () => void
}

export function MaintenanceForm({ maintenance, onSubmit, onCancel }: MaintenanceFormProps) {
  const [loading, setLoading] = useState(false)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [formData, setFormData] = useState({
    vehicle_id: maintenance?.vehicle_id || "",
    maintenance_type: maintenance?.maintenance_type || "itv",
    scheduled_date: maintenance?.scheduled_date ? new Date(maintenance.scheduled_date).toISOString().slice(0, 16) : "",
    completed_date: maintenance?.completed_date ? new Date(maintenance.completed_date).toISOString().slice(0, 16) : "",
    description: maintenance?.description || "",
    cost: maintenance?.cost || "",
    workshop_name: maintenance?.workshop_name || "",
    status: maintenance?.status || "scheduled",
    notes: maintenance?.notes || "",
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/vehicles")
      const data = await response.json()
      setVehicles(data)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const submitData: any = {
        ...formData,
        scheduled_date: new Date(formData.scheduled_date).toISOString(),
        cost: formData.cost ? Number.parseFloat(formData.cost.toString()) : null,
      }

      if (formData.completed_date) {
        submitData.completed_date = new Date(formData.completed_date).toISOString()
      }

      await onSubmit(submitData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="vehicle_id">Vehículo</Label>
        <Select value={formData.vehicle_id} onValueChange={(value) => setFormData({ ...formData, vehicle_id: value })}>
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
          <Label htmlFor="maintenance_type">Tipo de mantenimiento</Label>
          <Select
            value={formData.maintenance_type}
            onValueChange={(value) => setFormData({ ...formData, maintenance_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="itv">ITV</SelectItem>
              <SelectItem value="workshop">Taller</SelectItem>
              <SelectItem value="repair">Reparación</SelectItem>
              <SelectItem value="service">Servicio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scheduled">Programado</SelectItem>
              <SelectItem value="in_progress">En progreso</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduled_date">Fecha programada</Label>
          <Input
            id="scheduled_date"
            type="datetime-local"
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
            required
          />
        </div>

        {formData.status === "completed" && (
          <div className="space-y-2">
            <Label htmlFor="completed_date">Fecha completada</Label>
            <Input
              id="completed_date"
              type="datetime-local"
              value={formData.completed_date}
              onChange={(e) => setFormData({ ...formData, completed_date: e.target.value })}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe el mantenimiento..."
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workshop_name">Nombre del taller</Label>
          <Input
            id="workshop_name"
            value={formData.workshop_name}
            onChange={(e) => setFormData({ ...formData, workshop_name: e.target.value })}
            placeholder="Ej: Taller Mecánico López"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost">Coste (€)</Label>
          <Input
            id="cost"
            type="number"
            step="0.01"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            placeholder="0.00"
          />
        </div>
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
          {loading ? "Guardando..." : maintenance ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  )
}
