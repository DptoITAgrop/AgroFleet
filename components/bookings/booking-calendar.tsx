"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"
import type { Booking, Vehicle } from "@/lib/types"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"

interface BookingCalendarProps {
  vehicleId?: string
}

export function BookingCalendar({ vehicleId }: BookingCalendarProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [vehicleId, currentMonth])

  const fetchData = async () => {
    try {
      const start = startOfMonth(currentMonth)
      const end = endOfMonth(currentMonth)

      const bookingsUrl = vehicleId
        ? `/api/bookings?vehicle_id=${vehicleId}&start_date=${start.toISOString()}&end_date=${end.toISOString()}`
        : `/api/bookings?start_date=${start.toISOString()}&end_date=${end.toISOString()}`

      const [bookingsRes, vehiclesRes] = await Promise.all([fetch(bookingsUrl), fetch("/api/vehicles")])

      const [bookingsData, vehiclesData] = await Promise.all([bookingsRes.json(), vehiclesRes.json()])

      setBookings(bookingsData.filter((b: Booking) => b.status === "active"))
      setVehicles(vehiclesData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  const getBookingsForDay = (day: Date) => {
    return bookings.filter((booking) => {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      return isWithinInterval(day, { start, end }) || isSameDay(day, start) || isSameDay(day, end)
    })
  }

  if (loading) {
    return <div className="text-center py-8">Cargando calendario...</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dayBookings = getBookingsForDay(day)
              const hasBookings = dayBookings.length > 0

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-24 p-2 border rounded-lg ${
                    hasBookings ? "bg-primary/5 border-primary/20" : "bg-card"
                  }`}
                >
                  <div className="text-sm font-medium mb-1">{format(day, "d")}</div>
                  {dayBookings.length > 0 && (
                    <div className="space-y-1">
                      {dayBookings.slice(0, 2).map((booking) => (
                        <Badge key={booking.id} variant="secondary" className="text-xs w-full justify-start truncate">
                          {booking.vehicle?.license_plate}
                        </Badge>
                      ))}
                      {dayBookings.length > 2 && (
                        <Badge variant="outline" className="text-xs w-full">
                          +{dayBookings.length - 2} más
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
