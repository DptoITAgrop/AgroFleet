"use client"

import { useState, useEffect } from "react"
import { VehicleCard } from "./vehicle-card"
import { VehicleDetailDialog } from "./vehicle-detail-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VehicleForm } from "./vehicle-form"
import { Plus, Search } from "lucide-react"
import type { Vehicle } from "@/lib/types"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface VehicleListProps {
  isAdmin?: boolean
}

export function VehicleList({ isAdmin = false }: VehicleListProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showDialog, setShowDialog] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | undefined>()
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [detailVehicle, setDetailVehicle] = useState<Vehicle | null>(null)
  const [employeeId, setEmployeeId] = useState<string | undefined>()

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchVehicles()
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    filterVehicles()
  }, [vehicles, searchTerm, statusFilter])

  const fetchCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      setEmployeeId(user.id)
    }
  }

  const fetchVehicles = async () => {
    try {
      const response = await fetch("/api/vehicles")
      const data = await response.json()
      setVehicles(data)
    } catch (error) {
      console.error("Error fetching vehicles:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterVehicles = () => {
    let filtered = vehicles

    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.model.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter)
    }

    setFilteredVehicles(filtered)
  }

  const handleSubmit = async (data: Partial<Vehicle>) => {
    try {
      if (selectedVehicle) {
        await fetch(`/api/vehicles/${selectedVehicle.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      } else {
        await fetch("/api/vehicles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      }
      setShowDialog(false)
      setSelectedVehicle(undefined)
      fetchVehicles()
    } catch (error) {
      console.error("Error saving vehicle:", error)
    }
  }

  const handleVehicleClick = (vehicle: Vehicle) => {
    if (isAdmin) {
      setSelectedVehicle(vehicle)
      setShowDialog(true)
    } else {
      setDetailVehicle(vehicle)
      setShowDetailDialog(true)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Cargando vehículos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por matrícula, marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="available">Disponible</SelectItem>
            <SelectItem value="in_use">En uso</SelectItem>
            <SelectItem value="maintenance">Mantenimiento</SelectItem>
            <SelectItem value="unavailable">No disponible</SelectItem>
          </SelectContent>
        </Select>
        {isAdmin && (
          <Button
            onClick={() => {
              setSelectedVehicle(undefined)
              setShowDialog(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir vehículo
          </Button>
        )}
      </div>

      {filteredVehicles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No se encontraron vehículos</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onClick={() => handleVehicleClick(vehicle)} />
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedVehicle ? "Editar vehículo" : "Añadir vehículo"}</DialogTitle>
          </DialogHeader>
          <VehicleForm vehicle={selectedVehicle} onSubmit={handleSubmit} onCancel={() => setShowDialog(false)} />
        </DialogContent>
      </Dialog>

      <VehicleDetailDialog
        vehicle={detailVehicle}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        employeeId={employeeId}
      />
    </div>
  )
}
