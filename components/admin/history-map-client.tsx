"use client"

import { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarDays, Car, RefreshCcw, Route, AlertTriangle } from "lucide-react"

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

type VehicleOption = {
  vehicle_registration: string
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

// Iconos inicio/fin distintos
const startIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const endIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// "YYYY-MM-DDTHH:mm" => ISO UTC (string)
function localDatetimeToISO(value: string) {
  if (!value) return ""
  // value viene como "2025-12-22T10:27"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toISOString()
}

function toLocalDatetimeValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()

  useEffect(() => {
    if (positions.length < 2) return
    const bounds = L.latLngBounds(positions.map(([a, b]) => L.latLng(a, b)))
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, positions])

  return null
}

// Distancia aproximada (km) por Haversine (suficiente para UI)
function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371
  const toRad = (x: number) => (x * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLon = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])

  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2

  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

function fmtDuration(ms: number) {
  const m = Math.floor(ms / 60000)
  const h = Math.floor(m / 60)
  const mm = m % 60
  if (h <= 0) return `${mm} min`
  return `${h} h ${mm} min`
}

export default function HistoryMapClient() {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [vehicle, setVehicle] = useState<string>("")

  // ✅ siempre datetime-local real
  const [fromLocal, setFromLocal] = useState<string>("")
  const [toLocal, setToLocal] = useState<string>("")

  const [points, setPoints] = useState<GeoPoint[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    leafletIconFix()
  }, [])

  // Default: últimas 24h
  useEffect(() => {
    const now = new Date()
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000)
    setToLocal(toLocalDatetimeValue(now))
    setFromLocal(toLocalDatetimeValue(from))
  }, [])

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true)
      setError(null)

      const res = await fetch("/api/geo", { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Error /api/geo (${res.status})`)

      const list = Array.isArray(data) ? data : []
      const uniq = Array.from(
        new Set(list.map((x: any) => String(x?.vehicle_registration ?? "").trim()).filter(Boolean))
      )
        .sort((a, b) => a.localeCompare(b))
        .map((v) => ({ vehicle_registration: v }))

      setVehicles(uniq)
      if (!vehicle && uniq.length) setVehicle(uniq[0].vehicle_registration)
    } catch (e: any) {
      setError(e?.message ?? "Error cargando vehículos")
      setVehicles([])
    } finally {
      setLoadingVehicles(false)
    }
  }

  const fromISO = useMemo(() => localDatetimeToISO(fromLocal), [fromLocal])
  const toISO = useMemo(() => localDatetimeToISO(toLocal), [toLocal])
  const rangeOk = useMemo(() => {
    if (!fromISO || !toISO) return false
    return new Date(fromISO).getTime() <= new Date(toISO).getTime()
  }, [fromISO, toISO])

  const loadHistory = async () => {
    try {
      if (!vehicle) {
        setError("Selecciona un vehículo")
        return
      }
      if (!rangeOk) {
        setError("Rango de fechas inválido (revisa Desde/Hasta)")
        return
      }

      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        vehicle_registration: vehicle,
        from: fromISO,
        to: toISO,
        limit: "20000",
      })

      const res = await fetch(`/api/history-positions?${params.toString()}`, { cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? `Error historial (${res.status})`)

      setPoints(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message ?? "Error cargando historial")
      setPoints([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVehicles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const positions = useMemo<[number, number][]>(() => {
    return points
      .map((p) => [p.lat, p.lng ?? p.lon] as [number, number])
      .filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b))
  }, [points])

  const center = useMemo<[number, number]>(() => {
    const p = points[0]
    return p ? [p.lat, p.lng ?? p.lon] : [40.4168, -3.7038]
  }, [points])

  const start = points[0]
  const end = points.length ? points[points.length - 1] : undefined

  const km = useMemo(() => {
    if (positions.length < 2) return 0
    let sum = 0
    for (let i = 1; i < positions.length; i++) sum += haversineKm(positions[i - 1], positions[i])
    return sum
  }, [positions])

  const duration = useMemo(() => {
    if (!start || !end) return ""
    const a = new Date(start.recorded_at).getTime()
    const b = new Date(end.recorded_at).getTime()
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return ""
    return fmtDuration(b - a)
  }, [start, end])

  return (
    <div className="w-full space-y-4">
      <Card className="border-muted/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Historial de recorridos
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            {/* Vehículo */}
            <div className="md:col-span-4">
              <label className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Car className="h-4 w-4" /> Vehículo
              </label>

              <Select value={vehicle} onValueChange={setVehicle} disabled={loadingVehicles}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Selecciona un vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      (sin vehículos)
                    </SelectItem>
                  ) : null}
                  {vehicles.map((v) => (
                    <SelectItem key={v.vehicle_registration} value={v.vehicle_registration}>
                      {v.vehicle_registration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Desde */}
            <div className="md:col-span-3">
              <label className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-4 w-4" /> Desde
              </label>
              <Input
                className="h-10"
                type="datetime-local"
                value={fromLocal}
                onChange={(e) => setFromLocal(e.target.value)}
              />
            </div>

            {/* Hasta */}
            <div className="md:col-span-3">
              <label className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-4 w-4" /> Hasta
              </label>
              <Input
                className="h-10"
                type="datetime-local"
                value={toLocal}
                onChange={(e) => setToLocal(e.target.value)}
              />
            </div>

            {/* Acciones */}
            <div className="md:col-span-2 flex items-end gap-2">
              <Button
                className="h-10 flex-1"
                onClick={loadHistory}
                disabled={loading || !vehicle || !rangeOk}
              >
                {loading ? "Cargando..." : "Cargar"}
              </Button>

              <Button
                variant="outline"
                className="h-10"
                onClick={loadVehicles}
                disabled={loadingVehicles}
                title="Recargar vehículos"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Badges resumen */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Puntos: {points.length}</Badge>
            <Badge variant="secondary">Distancia aprox: {km.toFixed(1)} km</Badge>
            <Badge variant="secondary">Duración: {duration || "—"}</Badge>

            {!rangeOk ? (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Rango inválido
              </Badge>
            ) : null}
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
        </CardContent>
      </Card>

      <div className="h-[72vh] w-full rounded-2xl overflow-hidden border bg-white shadow-sm">
        <MapContainer center={center} zoom={7} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Traza */}
          {positions.length >= 2 ? <Polyline positions={positions} /> : null}
          {positions.length >= 2 ? <FitBounds positions={positions} /> : null}

          {/* Inicio */}
          {start ? (
            <Marker icon={startIcon} position={[start.lat, start.lng ?? start.lon]}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{start.vehicle_registration} · Inicio</div>
                  <div className="text-xs opacity-70">{new Date(start.recorded_at).toLocaleString()}</div>
                  {start.street || start.town ? (
                    <div className="text-xs">
                      {[start.street, start.town].filter(Boolean).join(" · ")}
                    </div>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ) : null}

          {/* Fin */}
          {end && end !== start ? (
            <Marker icon={endIcon} position={[end.lat, end.lng ?? end.lon]}>
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold">{end.vehicle_registration} · Fin</div>
                  <div>Velocidad: {end.speed ?? "—"}</div>
                  <div>Ignición: {end.ignition ? "ON" : "OFF"}</div>
                  <div className="text-xs opacity-70">{new Date(end.recorded_at).toLocaleString()}</div>
                  {end.street || end.town ? (
                    <div className="text-xs">
                      {[end.street, end.town].filter(Boolean).join(" · ")}
                    </div>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ) : null}
        </MapContainer>
      </div>

      {/* Hint: si no hay puntos, guía rápida */}
      {points.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          Si sigue en 0: revisa que el endpoint <b>/api/history-positions</b> lea de{" "}
          <b>geolocalizacion_history</b> (no de geolocalizacion) y que el cron esté insertando cada 5 minutos.
        </div>
      ) : null}
    </div>
  )
}
