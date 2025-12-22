import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const secret = url.searchParams.get("secret")

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 SOLO SERVER
  if (!serviceKey) {
    return NextResponse.json({ error: "Missing SUPABASE_SERVICE_ROLE_KEY" }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 1) Leer posiciones actuales
  const { data: current, error: readErr } = await supabase
    .from("geolocalizacion")
    .select("vehicle_registration, lat, lon, speed, direction, ignition, street, town, recorded_at")

  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 })

  if (!current?.length) return NextResponse.json({ inserted: 0 })

  // 2) Insertar en histórico
  const rows = current.map((r) => ({
    ...r,
    // opcional: por si quieres que “recorded_at” sea ahora en vez del del proveedor:
    // recorded_at: new Date().toISOString(),
  }))

  const { error: insErr } = await supabase.from("geolocalizacion_history").insert(rows)

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json({ inserted: rows.length })
}
