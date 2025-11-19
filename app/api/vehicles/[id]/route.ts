import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// Pequeño helper para sacar el id de forma compatible con Next 16
async function getIdFromContext(
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  const params = await (context as any).params
  return (params as { id: string }).id
}

// ============ GET ============

export async function GET(
  request: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const id = await getIdFromContext(context)
    const supabase = await getSupabaseServerClient()

    const { data: vehicle, error } = await supabase
      .from("vehiculos")
      .select("*")
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json(vehicle)
  } catch (error) {
    console.error("GET /api/vehicles/[id] error", error)
    return NextResponse.json({ error: "Error fetching vehicle" }, { status: 500 })
  }
}

// ============ PUT ============

export async function PUT(
  request: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const id = await getIdFromContext(context)
    const supabase = await getSupabaseServerClient()

    // 1) Auth
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr) throw authErr
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2) Comprobar admin
    const { data: employee, error: employeeErr } = await supabase
      .from("usuarios")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (employeeErr) throw employeeErr

    if (!employee?.is_admin) {
      return NextResponse.json(
        { error: "Only admins can update vehicles" },
        { status: 403 }
      )
    }

    // 3) Datos recibidos
    const body = await request.json()
    const { status, ...rest } = body ?? {}

    const update: Record<string, any> = { ...rest }

    // 4) Normalizar / validar estado si viene
    if (status !== undefined && status !== null && status !== "") {
      const allowed = ["available", "in_use", "maintenance", "inactive"] as const

      const map: Record<string, string> = {
        disponible: "available",
        "en uso": "in_use",
        en_uso: "in_use",
        uso: "in_use",
        mantenimiento: "maintenance",
        taller: "maintenance",
        baja: "inactive",
        inactivo: "inactive",
      }

      const normalized = map[String(status).toLowerCase()] ?? status

      if (!allowed.includes(normalized as any)) {
        return NextResponse.json(
          { error: `Estado de vehículo no válido: ${status}` },
          { status: 400 }
        )
      }

      update.status = normalized
    }

    // Evitar pisar campos con undefined
    Object.keys(update).forEach((key) => {
      if (update[key] === undefined) delete update[key]
    })

    // 5) Actualizar en Supabase
    const { data: vehicle, error: updateError } = await supabase
      .from("vehiculos")
      .update(update)
      .eq("id", id)
      .select("*")
      .single()

    if (updateError) throw updateError

    return NextResponse.json(vehicle, { status: 200 })
  } catch (error: any) {
    console.error("PUT /api/vehicles/[id] error", error)
    return NextResponse.json(
      { error: error?.message || "Error updating vehicle" },
      { status: 500 }
    )
  }
}

// ============ DELETE ============

export async function DELETE(
  request: Request,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {
  try {
    const id = await getIdFromContext(context)
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser()

    if (authErr) throw authErr
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: employee, error: employeeErr } = await supabase
      .from("usuarios")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (employeeErr) throw employeeErr

    if (!employee?.is_admin) {
      return NextResponse.json(
        { error: "Only admins can delete vehicles" },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabase
      .from("vehiculos")
      .delete()
      .eq("id", id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("DELETE /api/vehicles/[id] error", error)
    return NextResponse.json(
      { error: error?.message || "Error deleting vehicle" },
      { status: 500 }
    )
  }
}
