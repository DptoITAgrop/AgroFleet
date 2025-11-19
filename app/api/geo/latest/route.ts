import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // comprobar si es admin
  const { data: u } = await supabase
    .from("usuarios")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!u?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data, error } = await supabase
    .from("geolocalizacion")
    .select("vehicle_id, lat, lng, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
