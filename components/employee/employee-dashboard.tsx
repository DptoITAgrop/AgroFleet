"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Car, Calendar, Clock, Plus } from "lucide-react"
import type { Vehicle, Booking, Employee } from "@/lib/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"

interface EmployeeDashboardProps {
  employee: Employee
}

export function EmployeeDashboard({ employee }: EmployeeDashboardProps) {
  const [stats, setStats] = useState({
    activeBookings: 0,
    availableVehicles: 0,
    upcomingBookings: 0,
  })
  const [myBookings, setMyBookings] = useState<Booking[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [employee.id])

  const fetchDashboardData = async () => {
    try {
      const [bookingsRes, vehiclesRes] = await Promise.all([
        fetch(`/api/bookings?employee_id=${employee.id}`),
        fetch("/api/vehicles"),
      ])

      const [bookingsData, vehiclesData] = await Promise.all([bookingsRes.json(), vehiclesRes.json()])

      const now = new Date()
      const activeBookings = bookingsData.filter((b: Booking) => b.status === "active" && new Date(b.end_date) >= now)
      const upcomingBookings = bookingsData.filter(
        (b: Booking) => b.status === "active" && new Date(b.start_date) > now,
      )
      const available = vehiclesData.filter((v: Vehicle) => v.status === "available")

      setStats({
        activeBookings: activeBookings.length,
        availableVehicles: available.length,
        upcomingBookings: upcomingBookings.length,
      })

      setMyBookings(activeBookings.slice(0, 3))
      setAvailableVehicles(available.slice(0, 4))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Cargando...</div>
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bienvenido, {employee.full_name}</h1>
        <p className="text-muted-foreground mt-1">Gestiona tus reservas de vehículos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reservas Activas</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground mt-2">En uso actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vehículos Disponibles</CardTitle>
            <Car className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.availableVehicles}</div>
            <p className="text-xs text-muted-foreground mt-2">Listos para reservar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Próximas Reservas</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground mt-2">Programadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Mis Reservas Activas
            </CardTitle>
            <Link href="/dashboard/bookings">
              <Button variant="ghost" size="sm">
                Ver todas
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {myBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No tienes reservas activas</p>
                <Link href="/dashboard/vehicles">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Reservar vehículo
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myBookings.map((booking) => (
                  <div key={booking.id} className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">
                          {booking.vehicle?.license_plate} - {booking.vehicle?.brand} {booking.vehicle?.model}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">
                        Activa
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(booking.start_date), "PPp", { locale: es })} -{" "}
                      {format(new Date(booking.end_date), "PPp", { locale: es })}
                    </p>
                    <p className="text-sm">{booking.purpose}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Vehículos Disponibles
            </CardTitle>
            <Link href="/dashboard/vehicles">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {availableVehicles.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay vehículos disponibles</p>
            ) : (
              <div className="space-y-3">
                {availableVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{vehicle.license_plate}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                        Disponible
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">¿Necesitas un vehículo?</h3>
              <p className="text-sm text-muted-foreground mt-1">Reserva un vehículo disponible para tu próximo viaje</p>
            </div>
            <Link href="/dashboard/vehicles">
              <Button size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Reserva
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
