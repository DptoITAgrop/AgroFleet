"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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
  ignition?: string | boolean | null
  street?: string | null
  town?: string | null
  recorded_at: string
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

function ignitionLabel(v: GeoPoint["ignition"]) {
  if (v === true) return "ON"
  if (v === false) return "OFF"
  if (typeof v === "string") {
    const s = v.toUpperCase()
    if (s === "Y" || s === "YES" || s === "ON" || s === "TRUE" || s === "1") return "ON"
    if (s === "N" || s === "NO" || s === "OFF" || s === "FALSE" || s === "0") return "OFF"
  }
  return "—"
}

export default function AdminMapClient() {
  const [points, setPoints] = useState<GeoPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const alive = useRef(true)

  useEffect(() => {
    leafletIconFix()
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const center = useMemo<[number, number]>(() => {
    const p = points[0]
    return p ? [p.lat, p.lng ?? p.lon] : [40.4168, -3.7038]
  }, [points])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/geo", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Error /api/geo (${res.status})`)

      if (!alive.current) return
      setPoints(Array.isArray(data) ? data : [])
      setLastUpdated(new Date().toLocaleString())
    } catch (e: any) {
      if (!alive.current) return
      setError(e?.message ?? "Error cargando posiciones")
      setPoints([])
    } finally {
      if (alive.current) setLoading(false)
    }
  }

  const refresh = async () => {
    try {
      setRefreshing(true)
      setError(null)

      const res = await fetch("/api/geo/refresh", { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Error /api/geo/refresh (${res.status})`)

      await load()
    } catch (e: any) {
      setError(e?.message ?? "Error refrescando")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="h-[70vh] w-full rounded-xl overflow-hidden border bg-white">
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
            disabled={loading || refreshing}
          >
            Recargar
          </button>
          <button
            onClick={refresh}
            className="px-3 py-1.5 text-sm rounded-md border hover:bg-muted disabled:opacity-50"
            disabled={loading || refreshing}
          >
            {refreshing ? "Actualizando..." : "Refrescar"}
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
                <div>Ignición: {ignitionLabel(p.ignition)}</div>
                <div>Velocidad: {p.speed ?? "—"}</div>
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
