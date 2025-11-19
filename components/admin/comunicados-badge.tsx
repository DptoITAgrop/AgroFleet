// components/admin/comunicados-badge.tsx
"use client";

import { useEffect, useState } from "react";

export function ComunicadosBadge() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/comunicados");
        if (!res.ok) return;
        const data = await res.json();
        const abiertos = (data || []).filter((c: any) => c.status === "open").length;
        setCount(abiertos);
      } catch (e) {
        console.error("Error cargando comunicados abiertos", e);
      }
    }
    load();
  }, []);

  if (count === null || count === 0) return null;

  return (
    <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] px-2 py-0.5">
      {count}
    </span>
  );
}
