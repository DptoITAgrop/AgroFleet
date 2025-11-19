import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { data: fine, error } = await supabase
      .from("geolocalizacion")
      .select(
        `
        *,
        vehicle:vehiculos(*),
        employee:usuarios(*),
        booking:reservas(*)
      `,
      )
      .eq("id", id)
      .single()

    if (error) throw error

    return NextResponse.json(fine)
  } catch (error) {
    return NextResponse.json({ error: "Error fetching fine" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()
    const body = await request.json()

    const { data: fine, error } = await supabase.from("geolocalizacion").update(body).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json(fine)
  } catch (error) {
    return NextResponse.json({ error: "Error updating fine" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.from("geolocalizacion").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error deleting fine" }, { status: 500 })
  }
}
