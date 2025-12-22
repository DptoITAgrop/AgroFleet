import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const RADIUS_API_KEY = process.env.RADIUS_API_KEY
const CUSTOMER_ID = process.env.RADIUS_CUSTOMER_ID

export async function POST() {
  if (!RADIUS_API_KEY || !CUSTOMER_ID) {
    return NextResponse.json({ error: "Missing RADIUS_API_KEY or RADIUS_CUSTOMER_ID" }, { status: 500 })
  }

  const supabase = await getSupabaseServerClient()

  // auth + admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: u } = await supabase.from("usuarios").select("is_admin").eq("id", user.id).maybeSingle()
  if (!u?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // 1) Radius: live positions
  const url = `https://www.velocityfleet.com/api/mobile/kinesis/device-live-positions/?customer=${CUSTOMER_ID}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RADIUS_API_KEY}`,
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ error: `Radius error ${res.status}`, detail: text }, { status: 502 })
  }

  const payload = await res.json()

  // payload.devices[] según tu JSON
  const devices = Array.isArray(payload?.devices) ? payload.devices : []

  // 2) Normaliza para Supabase
  const rows = devices
    .map((d: any) => {
      const lat = Number(d.lat)
      const lon = Number(d.lon)
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null

      return {
        vehicle_registration: d.vehicle_registration ?? null,
        lat,
        lon,
        speed: d.speed ?? null,
        direction: d.direction ?? null,
        ignition: d.ignition ?? null,
        street: d.street ?? null,
        town: d.town ?? null,
        post_code: d.post_code ?? null,
        country: d.country ?? null,
        recorded_at: d.recorded_at ? new Date(d.recorded_at).toISOString() : new Date().toISOString(),
      }
    })
    .filter(Boolean)

  if (!rows.length) {
    return NextResponse.json({ inserted: 0, message: "No valid positions in Radius response" })
  }

  // 3) Insert
  const { error } = await supabase.from("geolocalizacion").insert(rows as any)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ inserted: rows.length })
}
