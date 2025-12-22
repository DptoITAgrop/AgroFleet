import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: u } = await supabase.from("usuarios").select("is_admin").eq("id", user.id).maybeSingle()
  if (!u?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data, error } = await supabase
    .from("geolocalizacion")
    .select("vehicle_registration, lat, lon, speed, direction, ignition, street, town, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(2000)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const latest = new Map<string, any>()
  for (const row of data ?? []) {
    const reg = row.vehicle_registration
    if (!reg) continue
    if (!latest.has(reg)) latest.set(reg, { ...row, lng: row.lon })
  }

  return NextResponse.json(Array.from(latest.values()))
}
