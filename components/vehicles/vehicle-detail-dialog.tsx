"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookingForm } from "@/components/bookings/booking-form"
import { Car, Calendar, Fuel, Users, MapPin, Clock } from "lucide-react"
import type { Vehicle } from "@/lib/types"

interface VehicleDetailDialogProps {
  vehicle: Vehicle | null
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId?: string
}

interface Booking {
  id: string
  start_date: string
  end_date: string
  employee: {
    full_name: string
  }
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

export function VehicleDetailDialog({ vehicle, open, onOpenChange, employeeId }: VehicleDetailDialogProps) {
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  useEffect(() => {
    if (vehicle && open) {
      fetchVehicleBookings()
    }
  }, [vehicle, open])

  const fetchVehicleBookings = async () => {
    if (!vehicle) return

    setLoadingBookings(true)
    try {
      const response = await fetch(`/api/bookings?vehicle_id=${vehicle.id}`)
      const data = await response.json()

      const now = new Date()
      const activeBookings = data.filter((booking: Booking) => {
        const endDate = new Date(booking.end_date)
        return endDate >= now
      })

      setBookings(activeBookings)
    } catch (error) {
      console.error("Error fetching bookings:", error)
    } finally {
      setLoadingBookings(false)
    }
  }

  if (!vehicle) return null

  const handleBookingSubmit = async (data: any) => {
    try {
      await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      setShowBookingForm(false)
      onOpenChange(false)
      window.location.reload()
    } catch (error) {
      console.error("Error creating booking:", error)
    }
  }

  const getNextAvailableDate = () => {
    if (bookings.length === 0) return "Disponible ahora"

    const sortedBookings = [...bookings].sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())

    const lastBooking = sortedBookings[0]
    const endDate = new Date(lastBooking.end_date)
    endDate.setDate(endDate.getDate() + 1)

    return endDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              {vehicle.license_plate}
            </span>
            <Badge className={statusColors[vehicle.status]} variant="outline">
              {statusLabels[vehicle.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {!showBookingForm ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Marca</p>
                <p className="font-medium">{vehicle.brand}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-medium">{vehicle.model}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Año</p>
                <p className="font-medium">{vehicle.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Color</p>
                <p className="font-medium">{vehicle.color || "N/A"}</p>
              </div>
            </div>

            <div className="space-y-3">
              {vehicle.fuel_type && (
                <div className="flex items-center gap-3">
                  <Fuel className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Combustible</p>
                    <p className="font-medium capitalize">{vehicle.fuel_type}</p>
                  </div>
                </div>
              )}
              {vehicle.seats && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Asientos</p>
                    <p className="font-medium">{vehicle.seats}</p>
                  </div>
                </div>
              )}
              {vehicle.current_location_lat && vehicle.current_location_lng && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                    <p className="font-medium">
                      {vehicle.current_location_lat.toFixed(4)}, {vehicle.current_location_lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {vehicle.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notas</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{vehicle.notes}</p>
              </div>
            )}

            {bookings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold">Reservas activas</h3>
                </div>
                <div className="space-y-2">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-muted/50 p-3 rounded-lg">
                      <p className="text-sm font-medium">{booking.employee.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.start_date).toLocaleDateString("es-ES")} -{" "}
                        {new Date(booking.end_date).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Próxima disponibilidad: {getNextAvailableDate()}
                  </p>
                </div>
              </div>
            )}

            {employeeId && vehicle.status === "available" && (
              <Button className="w-full" size="lg" onClick={() => setShowBookingForm(true)}>
                <Calendar className="w-4 h-4 mr-2" />
                Reservar este vehículo
              </Button>
            )}
          </div>
        ) : (
          <BookingForm
            employeeId={employeeId!}
            onSubmit={handleBookingSubmit}
            onCancel={() => setShowBookingForm(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
