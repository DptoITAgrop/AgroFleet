import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: vehicles, error } = await supabase
      .from("vehiculos")
      .select("*")
      .order("license_plate", { ascending: true })

    if (error) throw error

    return NextResponse.json(vehicles)
  } catch (error) {
    return NextResponse.json({ error: "Error fetching vehicles" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: employee } = await supabase.from("usuarios").select("is_admin").eq("id", user.id).single()

    if (!employee?.is_admin) {
      return NextResponse.json({ error: "Only admins can create vehicles" }, { status: 403 })
    }

    const body = await request.json()

    const { data: vehicle, error } = await supabase.from("vehiculos").insert(body).select().single()

    if (error) throw error

    return NextResponse.json(vehicle)
  } catch (error) {
    return NextResponse.json({ error: "Error creating vehicle" }, { status: 500 })
  }
}
