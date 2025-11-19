import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { data: maintenance, error } = await supabase
      .from("mantenimiento")
      .select(
        `
        *,
        vehicle:vehiculos(*)
      `,
      )
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json(maintenance)
  } catch (error) {
    return NextResponse.json({ error: "Error fetching maintenance" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    const { data: maintenance, error } = await supabase
      .from("mantenimiento")
      .update(body)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(maintenance)
  } catch (error) {
    return NextResponse.json({ error: "Error updating maintenance" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.from("mantenimiento").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error deleting maintenance" }, { status: 500 })
  }
}
