"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Vehicle } from "@/lib/types"
import { deduceYearFromLicensePlate } from "@/lib/utils/license-plate"

interface VehicleFormProps {
  vehicle?: Vehicle
  onSubmit: (data: Partial<Vehicle>) => Promise<void>
  onCancel: () => void
}

export function VehicleForm({ vehicle, onSubmit, onCancel }: VehicleFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    license_plate: vehicle?.license_plate || "",
    brand: vehicle?.brand || "",
    model: vehicle?.model || "",
    year: vehicle?.year || new Date().getFullYear(),
    color: vehicle?.color || "",
    vehicle_type: vehicle?.vehicle_type || "car",
    fuel_type: vehicle?.fuel_type || "gasoline",
    seats: vehicle?.seats || 5,
    status: vehicle?.status || "available",
    notes: vehicle?.notes || "",
  })

  useEffect(() => {
    if (formData.license_plate && !vehicle) {
      const deducedYear = deduceYearFromLicensePlate(formData.license_plate)
      setFormData((prev) => ({ ...prev, year: deducedYear }))
    }
  }, [formData.license_plate, vehicle])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit(formData)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="license_plate">Matrícula</Label>
          <Input
            id="license_plate"
            value={formData.license_plate}
            onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="brand">Marca</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="model">Modelo</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Año (auto-detectado)</Label>
          <Input
            id="year"
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: Number.parseInt(e.target.value) })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seats">Asientos</Label>
          <Input
            id="seats"
            type="number"
            value={formData.seats}
            onChange={(e) => setFormData({ ...formData, seats: Number.parseInt(e.target.value) })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vehicle_type">Tipo de vehículo</Label>
          <Select
            value={formData.vehicle_type}
            onValueChange={(value) => setFormData({ ...formData, vehicle_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="car">🚗 Coche</SelectItem>
              <SelectItem value="van">🚐 Furgoneta</SelectItem>
              <SelectItem value="truck">🚚 Camión</SelectItem>
              <SelectItem value="tractor">🚜 Tractor</SelectItem>
              <SelectItem value="trailer">🚛 Remolque</SelectItem>
              <SelectItem value="machinery">🏗️ Maquinaria</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuel_type">Tipo de combustible</Label>
          <Select value={formData.fuel_type} onValueChange={(value) => setFormData({ ...formData, fuel_type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gasoline">Gasolina</SelectItem>
              <SelectItem value="diesel">Diésel</SelectItem>
              <SelectItem value="electric">Eléctrico</SelectItem>
              <SelectItem value="hybrid">Híbrido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Estado</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Disponible</SelectItem>
            <SelectItem value="in_use">En uso</SelectItem>
            <SelectItem value="maintenance">Mantenimiento</SelectItem>
            <SelectItem value="unavailable">No disponible</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : vehicle ? "Actualizar" : "Crear"}
        </Button>
      </div>
    </form>
  )
}
