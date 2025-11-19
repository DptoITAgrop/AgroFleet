"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

interface Point {
  vehicle_id: string
  lat: number
  lng: number
  recorded_at: string
}

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

export default function AdminMapClient() {
  const [points, setPoints] = useState<Point[]>([])

  useEffect(() => {
    fetch("/api/geo/latest")
      .then((res) => res.json())
      .then((data) => setPoints(data))
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Mapa de Vehículos</h1>
      <div className="h-[75vh] w-full border rounded-lg overflow-hidden">
        <MapContainer center={[40.4168, -3.7038]} zoom={6} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {points.map((p) => (
            <Marker key={p.vehicle_id} position={[p.lat, p.lng]} icon={icon}>
              <Popup>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Vehículo:</strong> {p.vehicle_id}
                  </div>
                  <div>
                    <strong>Último registro:</strong>{" "}
                    {new Date(p.recorded_at).toLocaleString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
