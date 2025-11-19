"use client";

import { useMemo, useState } from "react";

type Vehicle = {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  year: number | null;
  status: string | null;
};

interface VehiclesGridProps {
  vehicles: Vehicle[];
  showStatusFilter?: boolean;         // solo admin
  showAddButton?: boolean;            // solo admin
  title?: string;
}

export function VehiclesGrid({
  vehicles,
  showStatusFilter = false,
  showAddButton = false,
  title = "Gestión de Vehículos",
}: VehiclesGridProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | "all">("all");

  const filtered = useMemo(() => {
    return vehicles.filter((v) => {
      const text = `${v.license_plate} ${v.brand} ${v.model}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : (v.status ?? "available") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, search, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Administra la flota de vehículos.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          {/* Filtro de estado solo en admin */}
          {showStatusFilter && (
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | string)
              }
              className="border rounded-md px-3 py-2 text-sm"
            >
              <option value="all">Todos los estados</option>
              <option value="available">Disponible</option>
              <option value="in_use">En uso</option>
              <option value="maintenance">En mantenimiento</option>
            </select>
          )}

          {/* Botón añadir solo admin */}
          {showAddButton && (
            <button className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              + Añadir vehículo
            </button>
          )}
        </div>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Buscar por matrícula, marca o modelo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border rounded-md px-3 py-2 text-sm"
        />
      </div>

      {/* Grid de tarjetas */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-4">
          No hay vehículos que coincidan con los filtros seleccionados.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <article
              key={v.id}
              className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <span className="text-lg">🚗</span>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">
                      {v.license_plate}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {v.brand} {v.model}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    v.status === "maintenance"
                      ? "bg-amber-50 text-amber-700"
                      : v.status === "in_use"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {v.status === "maintenance"
                    ? "En taller"
                    : v.status === "in_use"
                    ? "En uso"
                    : "Disponible"}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                <div className="flex items-center gap-1">
                  <span>📅</span>
                  <span>Año {v.year ?? "—"}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
