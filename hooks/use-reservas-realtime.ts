"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

type Reserva = any

type Options = {
  isAdmin: boolean
  employeeId?: string
  onUpsert: (row: Reserva) => void  // INSERT y UPDATE
  onDelete?: (id: string) => void   // DELETE
}

export function useReservasRealtime({ isAdmin, employeeId, onUpsert, onDelete }: Options) {
  useEffect(() => {
    const supabase = createClient()

    // Para empleados filtramos por su employee_id (extra seguridad de UI; RLS ya limita en backend)
    const filter = !isAdmin && employeeId ? `employee_id=eq.${employeeId}` : undefined

    const channel = supabase
      .channel("reservas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservas", ...(filter ? { filter } : {}) },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            onUpsert(payload.new as Reserva)
          } else if (payload.eventType === "DELETE") {
            onDelete?.((payload.old as Reserva).id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [isAdmin, employeeId, onUpsert, onDelete])
}
