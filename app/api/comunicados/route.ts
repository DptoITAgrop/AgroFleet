// app/api/comunicados/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

// 👉 GET: listar comunicados
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from("comunicados")
      .select(`
        id,
        title,
        message,
        status,
        created_by,
        created_at,
        updated_at
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(data ?? [], { status: 200 })
  } catch (e: any) {
    console.error("GET /api/comunicados error", e)
    return NextResponse.json(
      { error: e?.message || "Error obteniendo comunicados" },
      { status: 500 }
    )
  }
}

// 👉 POST: crear comunicado (empleados)
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await req.json()
    const { title, message } = body || {}

    if (!title || !message) {
      return NextResponse.json(
        { error: "title y message son obligatorios" },
        { status: 400 }
      )
    }

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr) throw userErr
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("comunicados")
      .insert({
        title,
        message,
        status: "open",
        created_by: user.id,
      })
      .select(`
        id,
        title,
        message,
        status,
        created_by,
        created_at,
        updated_at
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    console.error("POST /api/comunicados error", e)
    return NextResponse.json(
      { error: e?.message || "Error creando comunicado" },
      { status: 500 }
    )
  }
}

// 👉 PUT: actualizar comunicado (solo admin en el front)
export async function PUT(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const body = await req.json()
    const { id, title, message, status } = body || {}

    if (!id) {
      return NextResponse.json({ error: "id es obligatorio" }, { status: 400 })
    }

    const updatePayload: Record<string, any> = {}
    if (title !== undefined) updatePayload.title = title
    if (message !== undefined) updatePayload.message = message
    if (status !== undefined) updatePayload.status = status

    const { data, error } = await supabase
      .from("comunicados")
      .update(updatePayload)
      .eq("id", id)
      .select(`
        id,
        title,
        message,
        status,
        created_by,
        created_at,
        updated_at
      `)
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 200 })
  } catch (e: any) {
    console.error("PUT /api/comunicados error", e)
    return NextResponse.json(
      { error: e?.message || "Error actualizando comunicado" },
      { status: 500 }
    )
  }
}

// 👉 DELETE: borrar comunicado (solo admin en el front)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id es obligatorio" }, { status: 400 })
    }

    const { error } = await supabase.from("comunicados").delete().eq("id", id)
    if (error) throw error

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e: any) {
    console.error("DELETE /api/comunicados error", e)
    return NextResponse.json(
      { error: e?.message || "Error borrando comunicado" },
      { status: 500 }
    )
  }
}
