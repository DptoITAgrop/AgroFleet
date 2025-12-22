"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

type GeoPoint = {
  vehicle_registration: string
  lat: number
  lon: number
  lng?: number
  speed?: number | null
  direction?: number | null
  ignition?: any
  street?: string | null
  town?: string | null
  recorded_at: string            // ISO UTC
  time_text?: string | null      // "13:06\n23/12/2025" (como Postman)
}

const leafletIconFix = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

function ignitionLabel(v: any) {
  if (v === true) return "ON"
  if (v === false) return "OFF"
  if (typeof v === "string") {
    const s = v.trim().toUpperCase()
    if (["Y", "YES", "ON", "TRUE", "1"].includes(s)) return "ON"
    if (["N", "NO", "OFF", "FALSE", "0"].includes(s)) return "OFF"
  }
  return "—"
}

function normalizePoints(data: any): GeoPoint[] {
  const arr = Array.isArray(data) ? data : Array.isArray(data?.points) ? data.points : []
  return arr
    .map((p: any) => ({
      vehicle_registration: String(p.vehicle_registration ?? ""),
      lat: Number(p.lat),
      lon: Number(p.lon),
      lng: p.lng != null ? Number(p.lng) : undefined,
      speed: p.speed ?? null,
      direction: p.direction ?? null,
      ignition: p.ignition ?? null,
      street: p.street ?? null,
      town: p.town ?? null,
      recorded_at: String(p.recorded_at ?? ""),
      time_text: p.time_text != null ? String(p.time_text) : null,
    }))
    .filter(
      (p: GeoPoint) =>
        !!p.vehicle_registration &&
        Number.isFinite(p.lat) &&
        Number.isFinite(p.lon) &&
        Math.abs(p.lat) <= 90 &&
        Math.abs(p.lon) <= 180
    )
}

export default function AdminMapClient() {
  const [points, setPoints] = useState<GeoPoint[]>([])
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    leafletIconFix()
  }, [])

  const center = useMemo<[number, number]>(() => {
    const p = points[0]
    return p ? [p.lat, p.lng ?? p.lon] : [40.4168, -3.7038]
  }, [points])

  const refreshLive = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setSyncing(true)
      setError(null)

      const res = await fetch(`/api/geo/live?t=${Date.now()}`, {
        method: "POST",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Error refrescando /api/geo/live (${res.status})`)

      setPoints(normalizePoints(data))
      const insertedInfo = typeof data?.inserted === "number" ? ` · insertados: ${data.inserted}` : ""
      setLastUpdated(`${new Date().toLocaleString()}${insertedInfo}`)
    } catch (e: any) {
      if (e?.name === "AbortError") return
      setError(e?.message ?? "Error refrescando")
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    refreshLive()
    return () => abortRef.current?.abort()
  }, [refreshLive])

  return (
    <div className="h-[70vh] w-full rounded-xl overflow-hidden border bg-white">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-card">
        <div className="text-sm text-muted-foreground">
          {syncing ? "Cargando..." : `Posiciones: ${points.length}`}
          {lastUpdated ? <span className="ml-2 opacity-70">· {lastUpdated}</span> : null}
          {error ? <span className="ml-2 text-destructive">{error}</span> : null}
        </div>

        <button
          onClick={refreshLive}
          className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted disabled:opacity-50"
          disabled={syncing}
          title="Consulta la API en tiempo real y guarda en histórico"
        >
          {syncing ? "Actualizando..." : "Recargar"}
        </button>
      </div>

      <MapContainer center={center} zoom={7} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {points.map((p) => {
          const when = (p.time_text && p.time_text.trim().length > 0)
            ? p.time_text
            : new Date(p.recorded_at).toLocaleString("es-ES", { timeZone: "Europe/Madrid" })

          return (
            <Marker key={`${p.vehicle_registration}-${p.recorded_at}`} position={[p.lat, p.lng ?? p.lon]}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{p.vehicle_registration}</div>
                  <div>Ignición: {ignitionLabel(p.ignition)}</div>
                  <div>Velocidad: {p.speed ?? "—"}</div>
                  <div>Dirección: {p.direction ?? "—"}</div>
                  <div>{p.street ?? ""} {p.town ?? ""}</div>

                  {/* EXACTO como Postman */}
                  <div className="text-xs opacity-70" style={{ whiteSpace: "pre-line" }}>
                    {when}
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
