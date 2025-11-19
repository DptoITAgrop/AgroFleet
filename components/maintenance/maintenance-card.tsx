"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wrench, Calendar, Car, DollarSign, Trash2, Edit } from "lucide-react"
import type { Maintenance } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface MaintenanceCardProps {
  maintenance: Maintenance
  onEdit: () => void
  onDelete: () => void
}

const statusColors = {
  scheduled: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  in_progress: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
}

const statusLabels = {
  scheduled: "Programado",
  in_progress: "En progreso",
  completed: "Completado",
}

const typeLabels = {
  itv: "ITV",
  workshop: "Taller",
  repair: "Reparación",
  service: "Servicio",
}

export function MaintenanceCard({ maintenance, onEdit, onDelete }: MaintenanceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              {typeLabels[maintenance.maintenance_type]}
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Car className="w-4 h-4" />
              {maintenance.vehicle?.license_plate} - {maintenance.vehicle?.brand} {maintenance.vehicle?.model}
            </p>
          </div>
          <Badge className={statusColors[maintenance.status]} variant="outline">
            {statusLabels[maintenance.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Programado: {format(new Date(maintenance.scheduled_date), "PPp", { locale: es })}</span>
          </div>
          {maintenance.completed_date && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Completado: {format(new Date(maintenance.completed_date), "PPp", { locale: es })}</span>
            </div>
          )}
          {maintenance.cost && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>{maintenance.cost.toFixed(2)} €</span>
            </div>
          )}
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm">{maintenance.description}</p>
          {maintenance.workshop_name && (
            <p className="text-xs text-muted-foreground mt-1">Taller: {maintenance.workshop_name}</p>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 bg-transparent">
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete} className="flex-1">
            <Trash2 className="w-4 h-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
