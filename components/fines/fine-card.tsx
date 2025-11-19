"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, Calendar, Car, User, DollarSign, MapPin, Trash2, Edit, CheckCircle } from "lucide-react"
import type { Fine } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface FineCardProps {
  fine: Fine
  onEdit: () => void
  onDelete: () => void
}

const statusColors = {
  pending: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  paid: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  appealed: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
}

const statusLabels = {
  pending: "Pendiente",
  paid: "Pagada",
  appealed: "Recurrida",
}

export function FineCard({ fine, onEdit, onDelete }: FineCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Multa - {fine.amount.toFixed(2)} €
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Car className="w-4 h-4" />
              {fine.vehicle?.license_plate} - {fine.vehicle?.brand} {fine.vehicle?.model}
            </p>
          </div>
          <Badge className={statusColors[fine.status]} variant="outline">
            {statusLabels[fine.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Fecha: {format(new Date(fine.fine_date), "PPp", { locale: es })}</span>
          </div>

          {fine.employee && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>Conductor: {fine.employee.full_name}</span>
              {fine.identified_automatically && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20 text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Auto
                </Badge>
              )}
            </div>
          )}

          {fine.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{fine.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold">{fine.amount.toFixed(2)} €</span>
          </div>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-sm">{fine.description}</p>
          {fine.notes && <p className="text-xs text-muted-foreground mt-1">Notas: {fine.notes}</p>}
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
