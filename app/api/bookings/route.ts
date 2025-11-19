// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// ======================= GET =======================
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(request.url)

    // 1) Usuario logado
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr) throw authErr
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2) Mirar si es admin
    const { data: me, error: meErr } = await supabase
      .from("usuarios")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()

    if (meErr) throw meErr
    const isAdmin = !!me?.is_admin

    let query = supabase
      .from("reservas")
      .select(
        `
        id,
        vehicle_id,
        employee_id,
        start_date,
        end_date,
        purpose,
        destination,
        status,
        employee:usuarios (
          id,
          full_name,
          email,
          department
        ),
        vehicle:vehiculos (
          id,
          license_plate,
          brand,
          model,
          year,
          status
        )
      `
      )
      .order("start_date", { ascending: false })

    if (isAdmin) {
      // ADMIN: puede filtrar
      const employeeIdFilter = searchParams.get("employee_id")
      const vehicleIdFilter = searchParams.get("vehicle_id")
      const startDate = searchParams.get("start_date")
      const endDate = searchParams.get("end_date")

      if (employeeIdFilter) query = query.eq("employee_id", employeeIdFilter)
      if (vehicleIdFilter) query = query.eq("vehicle_id", vehicleIdFilter)
      if (startDate) query = query.gte("start_date", startDate)
      if (endDate) query = query.lte("end_date", endDate)
    } else {
      // EMPLEADO: solo ve sus reservas, ignoremos query params
      query = query.eq("employee_id", user.id)
    }

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json(data ?? [], { status: 200 })
  } catch (e: any) {
    console.error("GET /api/bookings error", e)
    return NextResponse.json(
      { error: e?.message || "Error fetching bookings" },
      { status: 500 }
    )
  }
}

// ======================= POST =======================
export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    // 0) Usuario logado
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr) throw authErr
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      vehicle_id,
      start_date,
      end_date,
      purpose,
      destination,
      employee_id: employeeIdFromBody, // solo se usa si es admin
    } = body || {}

    if (!vehicle_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      )
    }

    const startIso = new Date(start_date).toISOString()
    const endIso = new Date(end_date).toISOString()

    if (endIso <= startIso) {
      return NextResponse.json(
        { error: "La fecha fin debe ser posterior a la fecha inicio." },
        { status: 400 }
      )
    }

    // ¿Es admin?
    const { data: me, error: meErr } = await supabase
      .from("usuarios")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle()

    if (meErr) throw meErr
    const isAdmin = !!me?.is_admin

    // Si NO es admin, forzamos que la reserva sea para él mismo
    const employee_id = isAdmin ? employeeIdFromBody ?? user.id : user.id

    // 1) Comprobar vehículo
    const { data: vehicle, error: vehicleErr } = await supabase
      .from("vehiculos")
      .select("id, status")
      .eq("id", vehicle_id)
      .maybeSingle()

    if (vehicleErr) throw vehicleErr

    if (!vehicle) {
      return NextResponse.json(
        { error: "Vehículo no encontrado" },
        { status: 404 }
      )
    }

    // 2) ¿Está en mantenimiento?
    if (vehicle.status === "maintenance") {
      return NextResponse.json(
        {
          error:
            "El vehículo se encuentra actualmente en el taller y no puede reservarse en esas fechas.",
        },
        { status: 409 }
      )
    }

    // 3) ¿Está disponible?
    if (vehicle.status !== "available") {
      return NextResponse.json(
        {
          error:
            "El vehículo no está disponible para reservar (puede estar en uso o bloqueado).",
        },
        { status: 409 }
      )
    }

    // 4) Comprobar solapes con OTRAS reservas activas/pendientes
    const { data: overlappingBookings, error: overlapErr } = await supabase
      .from("reservas")
      .select("id")
      .eq("vehicle_id", vehicle_id)
      .in("status", ["active", "pending"])
      // solape si start < finSolicitado Y end > inicioSolicitado
      .lt("start_date", endIso)
      .gt("end_date", startIso)

    if (overlapErr) throw overlapErr

    if (overlappingBookings && overlappingBookings.length > 0) {
      return NextResponse.json(
        {
          error:
            "Esta fecha tiene otra reserva para este vehículo. Elige otro horario o vehículo.",
        },
        { status: 409 }
      )
    }

    // 5) Comprobar que no haya mantenimiento activo
    const { data: maintActive, error: maintErr } = await supabase
      .from("mantenimiento")
      .select("id, status")
      .eq("vehicle_id", vehicle_id)
      .in("status", ["in_progress", "scheduled"])
      .limit(1)

    if (maintErr) throw maintErr

    if (maintActive && maintActive.length > 0) {
      return NextResponse.json(
        {
          error:
            "El vehículo se encuentra en el taller en esas fechas. No puede reservarse.",
        },
        { status: 409 }
      )
    }

    // 6) Crear la reserva
    const { data, error } = await supabase
      .from("reservas")
      .insert({
        vehicle_id,
        employee_id,
        start_date: startIso,
        end_date: endIso,
        purpose: purpose ?? null,
        destination: destination ?? null,
        status: "active", // o "pending" si quieres flujo de aprobación
      })
      .select(
        `
        id,
        vehicle_id,
        employee_id,
        start_date,
        end_date,
        purpose,
        destination,
        status
      `
      )
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    console.error("POST /api/bookings error", e)
    return NextResponse.json(
      { error: e?.message || "Error creating booking" },
      { status: 500 }
    )
  }
}
