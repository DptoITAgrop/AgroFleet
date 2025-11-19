import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = await getSupabaseServerClient()

    const { data: vehicle, error } = await supabase.from("vehiculos").select("*").eq("id", id).single()

    if (error) throw error

    return NextResponse.json(vehicle)
  } catch (error) {
    return NextResponse.json({ error: "Error fetching vehicle" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: employee } = await supabase.from("usuarios").select("is_admin").eq("id", user.id).single()

    if (!employee?.is_admin) {
      return NextResponse.json({ error: "Only admins can update vehicles" }, { status: 403 })
    }

    const body = await request.json()

    const { data: vehicle, error: updateError } = await supabase
      .from("vehiculos")
      .update(body)
      .eq("id", id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(vehicle)
  } catch (error) {
    return NextResponse.json({ error: "Error updating vehicle" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: employee } = await supabase.from("usuarios").select("is_admin").eq("id", user.id).single()

    if (!employee?.is_admin) {
      return NextResponse.json({ error: "Only admins can delete vehicles" }, { status: 403 })
    }

    const { error: deleteError } = await supabase.from("vehiculos").delete().eq("id", id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Error deleting vehicle" }, { status: 500 })
  }
}
