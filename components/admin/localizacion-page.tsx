import LocalizacionClient from "./localizacion-client"

export default function LocalizacionPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Localización</h1>
      <p className="text-muted-foreground">Posición de los vehículos en el mapa</p>

      <div className="mt-4">
        <LocalizacionClient />
      </div>
    </div>
  )
}
