"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, User, Car, FileText } from "lucide-react"
import type { Booking } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface BookingCardProps {
  booking: Booking
  onEdit?: () => void
  onCancel?: () => void
  showActions?: boolean
}

const statusColors = {
  active: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  completed: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
}

const statusLabels = {
  active: "Activa",
  completed: "Completada",
  cancelled: "Cancelada",
}

export function BookingCard({ booking, onEdit, onCancel, showActions = false }: BookingCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Car className="w-5 h-5" />
              {booking.vehicle?.license_plate} - {booking.vehicle?.brand} {booking.vehicle?.model}
            </CardTitle>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4" />
              {booking.employee?.full_name}
            </p>
          </div>
          <Badge className={statusColors[booking.status]} variant="outline">
            {statusLabels[booking.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>
              {format(new Date(booking.start_date), "PPp", { locale: es })} -{" "}
              {format(new Date(booking.end_date), "PPp", { locale: es })}
            </span>
          </div>
          {booking.destination && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{booking.destination}</span>
            </div>
          )}
          <div className="flex items-start gap-2 text-sm">
            <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">{booking.purpose}</span>
          </div>
        </div>

        {showActions && booking.status === "active" && (
          <div className="flex gap-2 pt-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit} className="flex-1 bg-transparent">
                Editar
              </Button>
            )}
            {onCancel && (
              <Button variant="destructive" size="sm" onClick={onCancel} className="flex-1">
                Cancelar reserva
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
