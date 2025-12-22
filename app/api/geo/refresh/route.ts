import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs" // importante para asegurar process.env en Node

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

function asIsoDate(v: any): string {
  // Si viene "11:16 </br> 19/12/2025" o similar, mejor meter "now" y listo.
  // Puedes parsearlo luego si quieres fino.
  const d = new Date()
  return d.toISOString()
}

export async function POST() {
  const supabase = await getSupabaseServerClient()

  // auth
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // admin check
  const { data: u } = await supabase.from("usuarios").select("is_admin").eq("id", user.id).maybeSingle()
  if (!u?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // env
  const BASE = process.env.RADIUS_BASE_URL
  const PATH = process.env.RADIUS_LIVE_POSITIONS_PATH
  const CUSTOMER = process.env.RADIUS_CUSTOMER_ID
  const BEARER = process.env.RADIUS_BEARER_TOKEN

  if (!BASE || !PATH || !CUSTOMER || !BEARER) {
    return NextResponse.json(
      {
        error: "Missing env",
        BASE: !!BASE,
        PATH: !!PATH,
        CUSTOMER: !!CUSTOMER,
        BEARER: !!BEARER,
      },
      { status: 500 }
    )
  }

  const url = `${BASE}${PATH}?customer=${encodeURIComponent(CUSTOMER)}`

  // ✅ Igual que Postman: Authorization: Bearer <JWT>
  const headers: Record<string, string> = {
    accept: "application/json",
    authorization: `Bearer ${BEARER}`,
  }

  let respText = ""
  let json: any = null

  try {
    const resp = await fetch(url, { method: "POST", headers })
    respText = await resp.text()

    try {
      json = JSON.parse(respText)
    } catch {
      json = null
    }

    if (!resp.ok) {
      return NextResponse.json(
        {
          error: "Velocity request failed",
          status: resp.status,
          url,
          bodyPreview: respText.slice(0, 1200),
        },
        { status: 502 }
      )
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "Velocity fetch error", message: e?.message ?? String(e), url },
      { status: 502 }
    )
  }

  const items = pickArray(json)

  if (!items.length) {
    return NextResponse.json(
      {
        ok: true,
        inserted: 0,
        note: "La API respondió pero no se detectó array (devices/items/etc).",
        topKeys: json && typeof json === "object" ? Object.keys(json).slice(0, 50) : null,
        bodyPreview: respText.slice(0, 1200),
      },
      { status: 200 }
    )
  }

  const nowIso = new Date().toISOString()
  const nowMs = Date.now()

  // Mapeo a tu tabla: public.geolocalizacion
  const mapped = items
    .map((it: any) => {
      const lat = n(it.lat ?? it.latitude)
      const lon = n(it.lon ?? it.lng ?? it.longitude)

      const vehicle_registration = it.vehicle_registration ?? it.registration ?? it.plate ?? it.vehicle ?? null
      const radius_device_id = n(it.id ?? it.device_id ?? it.deviceId) // en tu JSON viene "id"

      if (!vehicle_registration || lat === null || lon === null) return null

      const tsMs = n(it.timestamp ?? it.timeStamp ?? it.ts) ?? nowMs

      return {
        radius_device_id, // tu columna es radius_device_id (int8)
        vehicle_registration: String(vehicle_registration),
        lat,
        lon,
        speed: n(it.speed),
        speed_measure_text: it.speed_measure_text ?? it.speed_measure ?? it.speed_unit ?? null,
        direction: n(it.direction ?? it.heading),
        ignition: it.ignition ?? null, // en tu JSON viene "Y"/"N"
        street: it.street ?? null,
        town: it.town ?? it.city ?? null,
        post_code: it.post_code ?? null,
        country: it.country ?? null,
        recorded_at: it.recorded_at ?? it.time ? asIsoDate(it.time) : nowIso,
        radius_timestamp: Math.trunc(tsMs),
      }
    })
    .filter(Boolean) as any[]

  if (!mapped.length) {
    return NextResponse.json(
      { ok: true, inserted: 0, note: "No se pudo mapear (faltan lat/lon/vehicle_registration).", sample: items[0] },
      { status: 200 }
    )
  }

  // UPSERT
  const { error: upsertErr } = await supabase.from("geolocalizacion").upsert(mapped, {
    onConflict: "vehicle_registration",
  })

  if (upsertErr) {
    return NextResponse.json(
      {
        error: upsertErr.message,
        hint: "Confirma que existe UNIQUE(vehicle_registration) y que los nombres de columnas coinciden.",
      },
      { status: 500 }
    )
  }

  // Histórico opcional
  await supabase.from("geolocalizacion_history").insert(mapped).catch(() => null)

  return NextResponse.json({ ok: true, inserted: mapped.length })
}
