"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

type Vehicle = {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  year?: number | null;
  status: string;
};

type Maintenance = {
  id: string;
  vehicle_id: string;
  status: "planned" | "in_progress" | "completed" | string;
  description: string | null;
  notes: string | null;
  start_date: string | null;
  end_date: string | null;
  vehicle: Vehicle;
};

export function MaintenanceList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Cargar vehículos + mantenimientos
  useEffect(() => {
    void fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [vehRes, mRes] = await Promise.all([
        fetch("/api/vehicles?admin=1", { cache: "no-store" }),
        fetch("/api/maintenance", { cache: "no-store" }),
      ]);

      const vehData = vehRes.ok ? await vehRes.json() : [];
      const mData = mRes.ok ? await mRes.json() : [];

      setVehicles(Array.isArray(vehData) ? vehData : []);
      setMaintenances(Array.isArray(mData) ? mData : []);
    } catch (err) {
      console.error("Error cargando mantenimiento:", err);
      setErrorMsg("No se pudo cargar la información de mantenimiento.");
    } finally {
      setLoading(false);
    }
  };

  const activeMaintenances = maintenances.filter(
    (m) => m.status === "in_progress" || m.status === "planned",
  );

  const handleCreate = async () => {
    if (!selectedVehicleId) {
      setErrorMsg("Selecciona un vehículo.");
      return;
    }
    setCreating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_id: selectedVehicleId,
          description: description || "Entrada a taller",
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error creando mantenimiento");
      }

      setDescription("");
      setSelectedVehicleId("");
      setSuccessMsg("Mantenimiento creado y vehículo marcado en taller.");
      await fetchAll();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "No se pudo crear el mantenimiento.");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = async (maintenanceId: string) => {
    if (!confirm("¿Marcar mantenimiento como completado y sacar el vehículo del taller?")) return;
    setClosingId(maintenanceId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maintenance_id: maintenanceId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Error cerrando mantenimiento");
      }

      setSuccessMsg("Mantenimiento completado. Vehículo disponible.");
      await fetchAll();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "No se pudo actualizar el mantenimiento.");
    } finally {
      setClosingId(null);
    }
  };

  const getVehicleLabel = (v: Vehicle) =>
    `${v.license_plate} - ${v.brand} ${v.model}${v.year ? " (" + v.year + ")" : ""}`;

  if (loading) {
    return <div className="py-8 text-center">Cargando datos de mantenimiento...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Mensajes */}
      {errorMsg && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}
      {successMsg && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">{successMsg}</AlertDescription>
        </Alert>
      )}

      {/* Formulario entrada a taller */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Programar / iniciar mantenimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto]">
            <div>
              <label className="mb-1 block text-sm font-medium">Vehículo</label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {getVehicleLabel(v)}{" "}
                      {v.status === "maintenance" ? " · (en taller)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Descripción</label>
              <input
                className="w-full rounded-md border px-3 py-2 text-sm"
                placeholder="Ej: Cambio de aceite, reparación de golpe..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? "Guardando..." : "Enviar al taller"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={fetchAll}
                title="Actualizar"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de mantenimientos activos */}
      <Card>
        <CardHeader>
          <CardTitle>Historial y mantenimientos activos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {maintenances.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No hay registros de mantenimiento.
            </div>
          ) : (
            <div className="space-y-3">
              {maintenances.map((m) => {
                const v = m.vehicle;
                const active = m.status === "in_progress" || m.status === "planned";
                return (
                  <div
                    key={m.id}
                    className="flex flex-col gap-3 rounded-lg border p-3 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {v ? getVehicleLabel(v) : "Vehículo desconocido"}
                        </span>
                        <Badge
                          variant={
                            m.status === "completed"
                              ? "outline"
                              : m.status === "in_progress"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {m.status === "in_progress"
                            ? "En taller"
                            : m.status === "completed"
                            ? "Completado"
                            : m.status}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {m.start_date && (
                          <span>
                            Inicio:{" "}
                            {new Date(m.start_date).toLocaleString("es-ES", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        )}
                        {m.end_date && (
                          <span>
                            {" "}
                            · Fin:{" "}
                            {new Date(m.end_date).toLocaleString("es-ES", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        )}
                      </div>
                      {m.description && (
                        <div className="mt-1 text-sm">Motivo: {m.description}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {active && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClose(m.id)}
                          disabled={closingId === m.id}
                        >
                          {closingId === m.id ? "Actualizando..." : "Marcar completado"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
