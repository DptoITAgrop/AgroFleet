// app/admin/comunicados/page.tsx
"use client";

import { useEffect, useState } from "react";

type Creator = {
  id: string;
  full_name: string | null;
  email: string;
  department: string | null;
};

type Comunicado = {
  id: string;
  title: string | null;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
  creator?: Creator | null;
};

const STATUS_LABEL: Record<string, string> = {
  open: "Abierto",
  in_progress: "En curso",
  closed: "Cerrado",
};

export default function AdminComunicadosPage() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadComunicados() {
    setLoading(true);
    const res = await fetch("/api/comunicados");
    setLoading(false);
    if (!res.ok) return;
    const data = await res.json();
    setComunicados(data);
  }

  useEffect(() => {
    loadComunicados();
  }, []);

  async function updateStatus(id: string, status: string) {
    const res = await fetch(`/api/comunicados/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const error = await res.json();
      alert(error.error ?? "Error actualizando estado");
      return;
    }
    loadComunicados();
  }

  async function deleteComunicado(id: string) {
    if (!confirm("¿Seguro que quieres borrar este comunicado?")) return;
    const res = await fetch(`/api/comunicados/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json();
      alert(error.error ?? "Error borrando comunicado");
      return;
    }
    loadComunicados();
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold">Comunicados de empleados</h1>

      {loading && <p className="text-sm text-gray-500">Cargando…</p>}

      {comunicados.length === 0 && !loading && (
        <p className="text-sm text-gray-500">No hay comunicados registrados.</p>
      )}

      <div className="space-y-3">
        {comunicados.map((c) => (
          <div
            key={c.id}
            className="border rounded-lg bg-white shadow-sm p-4 text-sm space-y-2"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h2 className="font-semibold">
                  {c.title || "Sin asunto"}
                </h2>
                {c.creator && (
                  <p className="text-xs text-gray-500 mt-1">
                    {c.creator.full_name || c.creator.email} —{" "}
                    {c.creator.department || "Sin departamento"}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={c.status}
                  onChange={(e) => updateStatus(c.id, e.target.value)}
                  className="border rounded px-2 py-1 text-xs"
                >
                  <option value="open">{STATUS_LABEL.open}</option>
                  <option value="in_progress">{STATUS_LABEL.in_progress}</option>
                  <option value="closed">{STATUS_LABEL.closed}</option>
                </select>

                <button
                  onClick={() => deleteComunicado(c.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Borrar
                </button>
              </div>
            </div>

            <p className="whitespace-pre-line text-gray-800">{c.message}</p>

            <p className="text-[11px] text-gray-400 flex gap-3">
              <span>
                Creado: {new Date(c.created_at).toLocaleString()}
              </span>
              <span>
                Última actualización: {new Date(c.updated_at).toLocaleString()}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
