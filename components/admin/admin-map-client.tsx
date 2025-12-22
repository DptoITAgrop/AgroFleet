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
  ignition?: boolean | null
  street?: string | null
  town?: string | null
  recorded_at: string
}

// ✅ Fix iconos Leaflet (Next/webpack)
const leafletIconFix = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  })
}

function normalizePoints(data: any): GeoPoint[] {
  if (!Array.isArray(data)) return []
  return data
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
      recorded_at: String(p.recorded_at ?? new Date().toISOString()),
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
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)
  const inFlightRef = useRef(false)

  useEffect(() => {
    leafletIconFix()
  }, [])

  const center = useMemo<[number, number]>(() => {
    const p = points[0]
    return p ? [p.lat, p.lng ?? p.lon] : [40.4168, -3.7038]
  }, [points])

  const load = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/geo", {
        cache: "no-store",
        signal: controller.signal,
        headers: { Accept: "application/json" },
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error ?? `Error cargando /api/geo (${res.status})`)
      }

      const normalized = normalizePoints(data)
      setPoints(normalized)
      setLastUpdated(new Date().toLocaleString())
    } catch (e: any) {
      if (e?.name === "AbortError") return
      setError(e?.message ?? "Error cargando posiciones")
      setPoints([])
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    // 1) sincroniza (POST /api/geo/refresh)
    // 2) recarga tabla (GET /api/geo)
    try {
      setSyncing(true)
      setError(null)

      const res = await fetch("/api/geo/refresh", {
        method: "POST",
        headers: { Accept: "application/json" },
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error ?? `Error refrescando /api/geo/refresh (${res.status})`)
      }

      // Si tu endpoint devuelve { inserted }, lo mostramos en el timestamp
      const insertedInfo =
        typeof data?.inserted === "number" ? ` · insertados: ${data.inserted}` : ""
      setLastUpdated(`${new Date().toLocaleString()}${insertedInfo}`)

      await load()
    } catch (e: any) {
      setError(e?.message ?? "Error refrescando")
    } finally {
      setSyncing(false)
    }
  }, [load])

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => {
      clearInterval(t)
      abortRef.current?.abort()
    }
  }, [load])

  return (
    <div className="h-[70vh] w-full rounded-xl overflow-hidden border bg-white">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-card">
        <div className="text-sm text-muted-foreground">
          {loading ? "Cargando..." : `Posiciones: ${points.length}`}
          {lastUpdated ? <span className="ml-2 opacity-70">· {lastUpdated}</span> : null}
          {error ? <span className="ml-2 text-destructive">{error}</span> : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted disabled:opacity-50"
            disabled={loading || syncing}
            title="Recargar desde Supabase"
          >
            {loading ? "Cargando..." : "Recargar"}
          </button>
        </div>
      </div>

      <MapContainer center={center} zoom={7} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((p) => (
          <Marker
            key={`${p.vehicle_registration}-${p.recorded_at}`}
            position={[p.lat, p.lng ?? p.lon]}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold">{p.vehicle_registration}</div>
                <div>Ignición: {p.ignition ? "ON" : "OFF"}</div>
                <div>Velocidad: {p.speed ?? "—"}</div>
                <div>Dirección: {p.direction ?? "—"}</div>
                <div>
                  {p.street ?? ""} {p.town ?? ""}
                </div>
                <div className="text-xs opacity-70">
                  {new Date(p.recorded_at).toLocaleString()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
