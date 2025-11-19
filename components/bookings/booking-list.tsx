"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { BookingCard } from "./booking-card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BookingForm } from "./booking-form"
import { Plus, RefreshCw } from "lucide-react"
import type { Booking } from "@/lib/types"
import { useReservasRealtime } from "@/hooks/use-reservas-realtime"

interface BookingListProps {
  employeeId: string
  isAdmin?: boolean
}

export function BookingList({ employeeId, isAdmin = false }: BookingListProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>()

  const isMounted = useRef(true)
  const abortRef = useRef<AbortController | null>(null)

  // ordena por start_date desc (más recientes primero)
  const sortByStartDesc = (list: Booking[]) =>
    [...list].sort((a, b) => (new Date(a.start_date) < new Date(b.start_date) ? 1 : -1))

  // limpieza al desmontar
  useEffect(() => {
    return () => {
      isMounted.current = false
      if (abortRef.current) abortRef.current.abort()
    }
  }, [])

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      setErrorMsg(null)

      // aborta peticiones previas
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()

      const url = isAdmin
        ? "/api/bookings" // devuelve todas
        : `/api/bookings?employee_id=${encodeURIComponent(employeeId)}`

      const res = await fetch(url, {
        cache: "no-store",
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(`API ${res.status}: ${txt || res.statusText}`)
      }

      const text = await res.text() // por si llega 204/empty
      const data: Booking[] = text ? JSON.parse(text) : []
      if (isMounted.current) setBookings(sortByStartDesc(Array.isArray(data) ? data : []))
    } catch (err: any) {
      if (err?.name === "AbortError") return
      console.error("Error fetching bookings:", err)
      if (isMounted.current) setErrorMsg("No se pudieron cargar las reservas.")
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }, [employeeId, isAdmin])

  // primera carga + cambios de props clave
  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  // Realtime: upsert y delete al vuelo (compatible con RLS)
  useReservasRealtime({
    isAdmin,
    employeeId,
    onUpsert: (row: Booking) => {
      setBookings((prev) => {
        const idx = prev.findIndex((b) => b.id === row.id)
        if (idx === -1) return sortByStartDesc([row, ...prev])
        const copy = [...prev]
        copy[idx] = { ...copy[idx], ...row }
        return sortByStartDesc(copy)
      })
    },
    onDelete: (id: string) => {
      setBookings((prev) => prev.filter((b) => b.id !== id))
    },
  })

  // refresco al recuperar foco
  useEffect(() => {
    const onFocus = () => fetchBookings()
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [fetchBookings])

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
      // Realtime actualizará la lista; como fallback:
      // setTimeout(fetchBookings, 150)
    } catch (error) {
      console.error("Error saving booking:", error)
      fetchBookings()
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm("¿Estás seguro de que quieres cancelar esta reserva?")) return
    try {
      await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      // Realtime hará el resto; fallback:
      // setTimeout(fetchBookings, 150)
    } catch (error) {
      console.error("Error cancelling booking:", error)
      fetchBookings()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{isAdmin ? "Reservas" : "Mis Reservas"}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchBookings()}
            title="Refrescar"
            aria-label="Refrescar"
          >
            <RefreshCw className="h-4 w-4" />
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
        <div className="text-center py-8">
          <p className="text-red-600 mb-3">{errorMsg}</p>
          <Button onClick={() => fetchBookings()}>Reintentar</Button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {isAdmin ? "No hay reservas" : "No tienes reservas"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              showActions={!isAdmin}
              onEdit={() => {
                setSelectedBooking(booking)
                setShowDialog(true)
              }}
              onCancel={() => handleCancel(booking.id)}
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
            employeeId={employeeId}
            onSubmit={handleSubmit}
            onCancel={() => setShowDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
