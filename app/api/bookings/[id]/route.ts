import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { data: booking, error } = await supabase
      .from("reservas")
      .select(
        `
        *,
        vehicle:vehiculos(*),
        employee:usuarios(*)
      `,
      )
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json(booking)
  } catch (error) {
    return NextResponse.json({ error: "Error fetching booking" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    const { data: booking, error } = await supabase.from("reservas").update(body).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json(booking)
  } catch (error) {
    return NextResponse.json({ error: "Error updating booking" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.from("reservas").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error deleting booking" }, { status: 500 })
  }
}
