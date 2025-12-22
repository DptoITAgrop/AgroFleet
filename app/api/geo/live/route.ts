import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

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

// "13:06 <br> 23/12/2025" -> "13:06\n23/12/2025"
function cleanTimeText(v: any): string | null {
  if (v == null) return null
  return String(v)
    .replace(/<\/?br\s*\/?>/gi, "\n")
    .trim()
}


export async function POST() {
  // 1) auth normal (para comprobar admin user)
  const supabase = await getSupabaseServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: u } = await supabase
    .from("usuarios")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!u?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // 2) env Radius/Velocity
  const BASE = process.env.RADIUS_BASE_URL
  const PATH = process.env.RADIUS_LIVE_POSITIONS_PATH
  const CUSTOMER = process.env.RADIUS_CUSTOMER_ID
  const BEARER = process.env.RADIUS_BEARER_TOKEN

  if (!BASE || !PATH || !CUSTOMER || !BEARER) {
    return NextResponse.json(
      { error: "Missing env (Radius)", BASE: !!BASE, PATH: !!PATH, CUSTOMER: !!CUSTOMER, BEARER: !!BEARER },
      { status: 500 }
    )
  }

  const url = `${BASE}${PATH}?customer=${encodeURIComponent(CUSTOMER)}`

  // 3) pedir posiciones a Velocity
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${BEARER}`,
      "cache-control": "no-cache",
      pragma: "no-cache",
    },
    cache: "no-store",
    next: { revalidate: 0 },
  })

  const text = await resp.text()
  if (!resp.ok) {
    return NextResponse.json(
      { error: "Velocity request failed", status: resp.status, bodyPreview: text.slice(0, 1200) },
      { status: 502 }
    )
  }

  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    return NextResponse.json(
      { error: "Velocity response is not JSON", bodyPreview: text.slice(0, 1200) },
      { status: 502 }
    )
  }

  const items = pickArray(json)

  // 4) Mapeo: guardamos recorded_at (UTC ISO) para histórico,
  // pero devolvemos time_text para pintar EXACTO igual que Postman.
  const mapped = items
    .map((it: any) => {
      const lat = n(it.lat ?? it.latitude)
      const lon = n(it.lon ?? it.lng ?? it.longitude)
      const reg = it.vehicle_registration ?? it.registration ?? it.plate ?? it.vehicle ?? null
      if (!reg || lat == null || lon == null) return null

      const tsRaw = n(it.timestamp ?? it.timeStamp ?? it.ts)
      const tsMs = tsRaw != null ? normalizeEpochToMs(tsRaw) : Date.now()

      const time_text = cleanTimeText(it.time)

      return {
        vehicle_registration: String(reg),
        radius_device_id: n(it.id ?? it.device_id ?? it.deviceId),
        lat,
        lon,
        speed: n(it.speed),
        direction: n(it.direction ?? it.heading),
        ignition: it.ignition ?? null,
        street: it.street ?? null,
        town: it.town ?? it.city ?? null,
        recorded_at: new Date(tsMs).toISOString(),     // UTC ISO para BD
        // radius_timestamp: Math.trunc(tsMs / 1000),   // solo si existe la columna
        time_text,                                     // SOLO PARA RESPUESTA
        // raw: it,                                     // solo si existe columna raw
      }
    })
    .filter(Boolean) as any[]

  // 5) Insert histórico con service role (bypassa RLS)
  try {
    const admin = getSupabaseAdminClient()

    if (mapped.length) {
      // IMPORTANTÍSIMO: no insertamos time_text si NO existe columna en la tabla
      const rowsForDb = mapped.map(({ time_text, ...rest }) => rest)

      const { error: insErr } = await admin.from("geolocalizacion_history").insert(rowsForDb)
      if (insErr) {
        return NextResponse.json(
          { error: "Insert history failed", details: insErr.message, hint: insErr.hint ?? null },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ ok: true, points: mapped, inserted: mapped.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 })
  }
}
