"use client"

import { useState, useEffect } from "react"
import type { Booking } from "@/lib/types"
import { BookingCard } from "@/components/bookings/booking-card"
import { BookingForm } from "@/components/bookings/booking-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RefreshCw, Plus } from "lucide-react"

interface AdminBookingsListProps {
  // por si en algún momento quieres filtrar por vehículo, etc.
}

export function AdminBookingsList(_props: AdminBookingsListProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>()

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      const res = await fetch("/api/bookings?admin=1", { cache: "no-store" })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || res.statusText)
      }

      const data = await res.json()
      setBookings(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error("Error fetching admin bookings:", e)
      setErrorMsg("No se pudieron cargar las reservas.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleSubmit = async (data: Partial<Booking>) => {
    try {
      if (selectedBooking) {
        await fetch(`/api/bookings/${selectedBooking.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      } else {
        await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      }
      setShowDialog(false)
      setSelectedBooking(undefined)
      fetchBookings()
    } catch (e) {
      console.error("Error saving booking:", e)
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm("¿Cancelar esta reserva?")) return
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      fetchBookings()
    } catch (e) {
      console.error("Error cancelling booking:", e)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Reservas</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={fetchBookings}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => {
              setSelectedBooking(undefined)
              setShowDialog(true)
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva reserva
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Cargando reservas...</div>
      ) : errorMsg ? (
        <div className="text-center py-8 text-red-600">{errorMsg}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No hay reservas</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              showActions={false} // el admin no necesita los mismos botones que el empleado
              onEdit={() => {
                setSelectedBooking(b)
                setShowDialog(true)
              }}
              onCancel={() => handleCancel(b.id)}
            />
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedBooking ? "Editar reserva" : "Nueva reserva"}</DialogTitle>
          </DialogHeader>
          <BookingForm
            booking={selectedBooking}
            employeeId={"" /* el admin podrá elegir empleado más adelante si quieres */}
            onSubmit={handleSubmit}
            onCancel={() => setShowDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
