"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function RefreshControls({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/geo/refresh", { method: "POST" })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) throw new Error(data?.error ?? `Error refrescando (${res.status})`)

      onDone()
    } catch (e: any) {
      setError(e?.message ?? "Error refrescando")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button type="button" onClick={refresh} disabled={loading}>
        {loading ? "Actualizando..." : "Refrescar"}
      </Button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )
}
