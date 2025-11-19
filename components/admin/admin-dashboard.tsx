"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Car, Calendar, Wrench, AlertCircle, TrendingUp } from "lucide-react"
import type { Vehicle, Booking, Maintenance, Fine, Employee } from "@/lib/types"
import { BookingCalendar } from "@/components/bookings/booking-calendar"

interface AdminDashboardProps {
  employee: Employee
}

export function AdminDashboard({ employee }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    inUseVehicles: 0,
    maintenanceVehicles: 0,
    activeBookings: 0,
    upcomingMaintenance: 0,
    pendingFines: 0,
  })
  const [recentBookings, setRecentBookings] = useState<Booking[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [vehiclesRes, bookingsRes, maintenanceRes, finesRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/bookings"),
        fetch("/api/maintenance"),
        fetch("/api/fines"),
      ])

      const [vehiclesData, bookingsData, maintenanceData, finesData] = await Promise.all([
        vehiclesRes.json(),
        bookingsRes.json(),
        maintenanceRes.json(),
        finesRes.json(),
      ])

      setVehicles(vehiclesData)

      const now = new Date()
      const activeBookings = bookingsData.filter((b: Booking) => b.status === "active")
      const upcomingMaintenance = maintenanceData.filter(
        (m: Maintenance) => m.status === "scheduled" && new Date(m.scheduled_date) > now,
      )
      const pendingFines = finesData.filter((f: Fine) => f.status === "pending")

      setStats({
        totalVehicles: vehiclesData.length,
        availableVehicles: vehiclesData.filter((v: Vehicle) => v.status === "available").length,
        inUseVehicles: vehiclesData.filter((v: Vehicle) => v.status === "in_use").length,
        maintenanceVehicles: vehiclesData.filter((v: Vehicle) => v.status === "maintenance").length,
        activeBookings: activeBookings.length,
        upcomingMaintenance: upcomingMaintenance.length,
        pendingFines: pendingFines.length,
      })

      setRecentBookings(activeBookings.slice(0, 5))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Cargando dashboard...</div>
  }

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bienvenido, {employee.full_name}</h1>
        <p className="text-muted-foreground mt-1">Panel de control de la flota</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Vehículos</CardTitle>
            <Car className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVehicles}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                {stats.availableVehicles} disponibles
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">En Uso</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inUseVehicles}</div>
            <p className="text-xs text-muted-foreground mt-2">{stats.activeBookings} reservas activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mantenimiento</CardTitle>
            <Wrench className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenanceVehicles}</div>
            <p className="text-xs text-muted-foreground mt-2">{stats.upcomingMaintenance} próximos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Multas Pendientes</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingFines}</div>
            <p className="text-xs text-muted-foreground mt-2">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              Vehículos Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vehicles.filter((v) => v.status === "available").length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No hay vehículos disponibles</p>
            ) : (
              <div className="space-y-3">
                {vehicles
                  .filter((v) => v.status === "available")
                  .slice(0, 3)
                  .map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{vehicle.license_plate}</p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.brand} {vehicle.model}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                        Disponible
                      </Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Reservas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No hay reservas activas</p>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{booking.vehicle?.license_plate}</p>
                      <p className="text-sm text-muted-foreground">{booking.employee?.full_name}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-500/20">
                      En uso
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendario de Reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BookingCalendar />
        </CardContent>
      </Card>
    </div>
  )
}
