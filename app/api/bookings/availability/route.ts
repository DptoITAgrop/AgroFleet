// app/api/bookings/availability/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

type AvailabilityResult = {
  available: boolean
  reason: string | null
  message?: string
}

async function checkAvailability(
  vehicleId?: string,
  start?: string,
  end?: string
): Promise<AvailabilityResult> {
  const supabase = await getSupabaseServerClient()

  // 0) Comprobación básica de parámetros
  if (!vehicleId || !start || !end) {
    return {
      available: false,
      reason: "invalid_params",
      message: "vehicle_id, start_date y end_date son obligatorios",
    }
  }

  // 1) Normalizar y validar fechas
  const startDate = new Date(start)
  const endDate = new Date(end)

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return {
      available: false,
      reason: "invalid_date",
      message:
        "Las fechas seleccionadas no tienen un formato válido. Vuelve a seleccionarlas.",
    }
  }

  const startIso = startDate.toISOString()
  const endIso = endDate.toISOString()

  if (endIso <= startIso) {
    return {
      available: false,
      reason: "invalid_range",
      message: "La fecha de fin debe ser posterior a la de inicio.",
    }
  }

  // 2) Comprobar que el vehículo existe
  const { data: vehicle, error: vehicleErr } = await supabase
    .from("vehiculos")
    .select("id, status")
    .eq("id", vehicleId)
    .maybeSingle()

  if (vehicleErr) throw vehicleErr

  if (!vehicle) {
    return {
      available: false,
      reason: "not_found",
      message: "Vehículo no encontrado.",
    }
  }

  // 3) Bloquear si está en mantenimiento
  if (vehicle.status === "maintenance") {
    return {
      available: false,
      reason: "maintenance",
      message: "El vehículo está en el taller y no puede reservarse.",
    }
  }

  // 4) Bloquear si el estado del vehículo no es "available"
  if (vehicle.status !== "available") {
    return {
      available: false,
      reason: "vehicle_status",
      message: "El vehículo no está disponible para reservar.",
    }
  }

  // 5) Buscar solapes de reservas (activas o pendientes)
  const { data: overlappingBookings, error: overlapErr } = await supabase
    .from("reservas")
    .select("id")
    .eq("vehicle_id", vehicleId)
    .in("status", ["active", "pending"])
    // solape: start < finSolicitado Y end > inicioSolicitado
    .lt("start_date", endIso)
    .gt("end_date", startIso)

  if (overlapErr) throw overlapErr

  if (overlappingBookings && overlappingBookings.length > 0) {
    return {
      available: false,
      reason: "booking_conflict",
      message: "Ya existe otra reserva para ese vehículo en esas fechas.",
    }
  }

  // 6) Comprobar mantenimientos activos
  const { data: maintActive, error: maintErr } = await supabase
    .from("mantenimiento")
    .select("id, status")
    .eq("vehicle_id", vehicleId)
    .in("status", ["in_progress", "scheduled"])
    .limit(1)

  if (maintErr) throw maintErr

  if (maintActive && maintActive.length > 0) {
    return {
      available: false,
      reason: "maintenance_active",
      message: "El vehículo tiene un mantenimiento activo en esas fechas.",
    }
  }

  // ✅ Si llega aquí, está disponible
  return {
    available: true,
    reason: null,
    message: "Vehículo disponible para las fechas seleccionadas.",
  }
}

// ---------- POST (lo que usa el frontend) ----------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { vehicle_id, start_date, end_date } = body || {}

    const result = await checkAvailability(vehicle_id, start_date, end_date)

    return NextResponse.json(result, { status: 200 })
  } catch (e: any) {
    console.error("POST /api/bookings/availability error", e)
    return NextResponse.json(
      {
        available: false,
        reason: "server_error",
        message: e?.message || "Error comprobando disponibilidad",
      },
      { status: 500 }
    )
  }
}

// ---------- GET opcional con query params ----------
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const vehicleId = searchParams.get("vehicle_id") || undefined
    const start = searchParams.get("start_date") || undefined
    const end = searchParams.get("end_date") || undefined

    const result = await checkAvailability(vehicleId, start, end)
    return NextResponse.json(result, { status: 200 })
  } catch (e: any) {
    console.error("GET /api/bookings/availability error", e)
    return NextResponse.json(
      {
        available: false,
        reason: "server_error",
        message: e?.message || "Error comprobando disponibilidad",
      },
      { status: 500 }
    )
  }
}
