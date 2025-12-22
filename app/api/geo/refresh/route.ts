import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function pickArray(payload: any): any[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.devices)) return payload.devices
  if (Array.isArray(payload?.result)) return payload.result
  return []
}

function n(v: any): number | null {
  const x = Number(v)
  return Number.isFinite(x) ? x : null
}

function normalizeEpochToMs(ts: number): number {
  return ts > 1e12 ? ts : ts * 1000
}

function parseVelocityTimeToIso(v: any): string | null {
  if (!v) return null
  const s = String(v)
    .replace(/<\/?br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim()

  const m = s.match(/(\d{1,2}):(\d{2})\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (!m) return null

  const [, hh, mm, dd, MM, yyyy] = m
  const d = new Date(Number(yyyy), Number(MM) - 1, Number(dd), Number(hh), Number(mm), 0)
  return d.toISOString()
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL")
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

export async function POST() {
  // ✅ usa service role para escribir (bypassa RLS)
  let supabase: ReturnType<typeof supabaseAdmin>
  try {
    supabase = supabaseAdmin()
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Supabase admin client error" }, { status: 500 })
  }

  // env Velocity
  const BASE = process.env.RADIUS_BASE_URL
  const PATH = process.env.RADIUS_LIVE_POSITIONS_PATH
  const CUSTOMER = process.env.RADIUS_CUSTOMER_ID
  const BEARER = process.env.RADIUS_BEARER_TOKEN

  if (!BASE || !PATH || !CUSTOMER || !BEARER) {
    return NextResponse.json(
      { error: "Missing env", BASE: !!BASE, PATH: !!PATH, CUSTOMER: !!CUSTOMER, BEARER: !!BEARER },
      { status: 500 }
    )
  }

  const url = `${BASE}${PATH}?customer=${encodeURIComponent(CUSTOMER)}`
  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${BEARER}`,
    "cache-control": "no-cache",
    pragma: "no-cache",
  }

  let respText = ""
  let json: any = null

  try {
    const resp = await fetch(url, { method: "POST", headers, cache: "no-store", next: { revalidate: 0 } })
    respText = await resp.text()
    try {
      json = JSON.parse(respText)
    } catch {
      json = null
    }

    if (!resp.ok) {
      return NextResponse.json(
        { error: "Velocity request failed", status: resp.status, url, bodyPreview: respText.slice(0, 1200) },
        { status: 502 }
      )
    }
  } catch (e: any) {
    return NextResponse.json({ error: "Velocity fetch error", message: e?.message ?? String(e), url }, { status: 502 })
  }

  const items = pickArray(json)
  if (!items.length) {
    return NextResponse.json(
      { ok: true, inserted: 0, note: "No array detectado", topKeys: json ? Object.keys(json).slice(0, 50) : null },
      { status: 200 }
    )
  }

  const incomingTs = items
    .map((it: any) => n(it.timestamp ?? it.timeStamp ?? it.ts))
    .filter((x: any) => x != null) as number[]
  const maxIncomingTs = incomingTs.length ? Math.max(...incomingTs) : null

  const nowIso = new Date().toISOString()

  const mapped = items
    .map((it: any) => {
      const lat = n(it.lat ?? it.latitude)
      const lon = n(it.lon ?? it.lng ?? it.longitude)

      const vehicle_registration =
        it.vehicle_registration ?? it.vehicle_registration ?? it.registration ?? it.plate ?? it.vehicle ?? null

      const radius_device_id = n(it.id ?? it.device_id ?? it.deviceId)

      if (!vehicle_registration || lat === null || lon === null) return null

      const tsRaw = n(it.timestamp ?? it.timeStamp ?? it.ts)
      const tsMs = tsRaw != null ? normalizeEpochToMs(tsRaw) : null
      const fromTsIso = tsMs != null ? new Date(tsMs).toISOString() : null
      const fromTimeIso = parseVelocityTimeToIso(it.time)
      const recorded_at = fromTsIso ?? fromTimeIso ?? nowIso

      const radius_timestamp =
        tsRaw != null ? Math.trunc((tsMs as number) / 1000) : Math.trunc(Date.now() / 1000)

      return {
        radius_device_id,
        vehicle_registration: String(vehicle_registration),
        lat,
        lon,
        speed: n(it.speed),
        speed_measure_text: it.speed_measure_text ?? it.speed_measure ?? it.speed_unit ?? null,
        direction: n(it.direction ?? it.heading),
        ignition: it.ignition ?? null,
        street: it.street ?? null,
        town: it.town ?? it.city ?? null,
        post_code: it.post_code ?? null,
        country: it.country ?? null,
        recorded_at,
        radius_timestamp,
        raw: it,
      }
    })
    .filter(Boolean) as any[]

  // ✅ si quieres forzar que te devuelva filas, añade .select()
  const { error: upsertErr } = await supabase.from("geolocalizacion").upsert(mapped, {
    onConflict: "vehicle_registration",
  })

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  const { data: dbMaxRow, error: dbMaxErr } = await supabase
    .from("geolocalizacion")
    .select("radius_timestamp, recorded_at, vehicle_registration")
    .order("radius_timestamp", { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    ok: true,
    inserted: mapped.length,
    maxIncomingTs,
    maxIncomingIso: maxIncomingTs ? new Date(normalizeEpochToMs(maxIncomingTs)).toISOString() : null,
    dbMax: dbMaxErr ? { error: dbMaxErr.message } : dbMaxRow ?? null,
  })
}
