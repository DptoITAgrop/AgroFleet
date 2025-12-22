// app/api/history-positions/route.ts
import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(req: Request) {
  const supabase = await getSupabaseServerClient()

  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 })
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: u, error: uerr } = await supabase
    .from("usuarios")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 })
  if (!u?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url = new URL(req.url)
  const vehicle_registration = url.searchParams.get("vehicle_registration")
  const from = url.searchParams.get("from")
  const to = url.searchParams.get("to")
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "5000"), 20000)

  if (!vehicle_registration) {
    return NextResponse.json({ error: "vehicle_registration is required" }, { status: 400 })
  }

  let q = supabase
    .from("geolocalizacion_history")
    .select("vehicle_registration, lat, lon, speed, direction, ignition, street, town, recorded_at")
    .eq("vehicle_registration", vehicle_registration)
    .order("recorded_at", { ascending: true })
    .limit(limit)

  if (from) q = q.gte("recorded_at", from)
  if (to) q = q.lte("recorded_at", to)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json((data ?? []).map((r) => ({ ...r, lng: r.lon })))
}
  