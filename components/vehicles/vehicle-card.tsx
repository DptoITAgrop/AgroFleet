"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, Fuel } from "lucide-react"
import type { Vehicle } from "@/lib/types"

interface VehicleCardProps {
  vehicle: Vehicle
  onClick?: () => void
}

const statusColors = {
  available: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  in_use: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  maintenance: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  unavailable: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

const statusLabels = {
  available: "Disponible",
  in_use: "En uso",
  maintenance: "Mantenimiento",
  unavailable: "No disponible",
}

function getVehicleIcon(vehicleType: string) {
  switch (vehicleType) {
    case "tractor":
      return "🚜"
    case "trailer":
      return "🚛"
    case "truck":
      return "🚚"
    case "van":
      return "🚐"
    case "machinery":
      return "🏗️"
    default:
      return "🚗"
  }
}

export function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">
              {getVehicleIcon(vehicle.vehicle_type)}
            </div>
            <div>
              <CardTitle className="text-lg">{vehicle.license_plate}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {vehicle.brand} {vehicle.model}
              </p>
            </div>
          </div>
          <Badge className={statusColors[vehicle.status]} variant="outline">
            {statusLabels[vehicle.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Año {vehicle.year}</span>
        </div>
        {vehicle.fuel_type && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Fuel className="w-4 h-4" />
            <span className="capitalize">{vehicle.fuel_type}</span>
          </div>
        )}
        {vehicle.current_location_lat && vehicle.current_location_lng && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Ubicación disponible</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
