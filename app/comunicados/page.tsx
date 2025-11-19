"use client"

import { useEffect, useState } from "react"
import { MessageCircle, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Comunicado = {
  id: string
  title: string
  message: string
  status: string
  created_at: string
}

export default function EmployeeComunicadosPage() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // --- Cargar comunicados ---
  const loadComunicados = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/comunicados")
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error cargando comunicados")
      }

      const data: Comunicado[] = await res.json()
      setComunicados(data)
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Error cargando comunicados")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComunicados()
  }, [])

  // --- Enviar nuevo comunicado ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim() || !message.trim()) {
      setError("Título y mensaje son obligatorios")
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch("/api/comunicados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error enviando comunicado")
      }

      const nuevo: Comunicado = await res.json()
      setComunicados((prev) => [nuevo, ...prev])
      setTitle("")
      setMessage("")
      setSuccess("Comunicado enviado correctamente")
    } catch (e: any) {
      console.error(e)
      setError(e?.message || "Error enviando el comunicado")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* CABECERA */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Comunicados para el administrador
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Envía avisos sobre incidencias, luces de avería, dudas u otros temas
              relacionados con los vehículos. Los administradores recibirán tus mensajes.
            </p>
          </div>
        </div>
      </div>

      {/* CONTENIDO RESPONSIVE: formulario + lista */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)]">
        {/* FORMULARIO */}
        <section className="border rounded-xl bg-card shadow-sm p-4 sm:p-5 space-y-4">
          <h2 className="text-sm font-medium">Nuevo comunicado</h2>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Título
              </label>
              <Input
                placeholder="Ej: Se ha encendido la luz de fallo motor"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Mensaje
              </label>
              <Textarea
                placeholder="Describe brevemente lo que ocurre..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar comunicado
                  </>
                )}
              </Button>

              {error && (
                <p className="text-sm text-red-600 min-w-[220px]">
                  {error}
                </p>
              )}
              {success && !error && (
                <p className="text-sm text-emerald-600 min-w-[220px]">
                  {success}
                </p>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Los comunicados no se pueden editar ni borrar por los empleados.
              Si necesitas corregir algo, envía un nuevo mensaje indicando la corrección.
            </p>
          </form>
        </section>

        {/* LISTA DE COMUNICADOS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium">Comunicados enviados</h2>
            {loading && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                Cargando…
              </span>
            )}
          </div>

          {!loading && comunicados.length === 0 && (
            <p className="text-sm text-muted-foreground border rounded-xl bg-card p-4">
              Todavía no has enviado ningún comunicado.
            </p>
          )}

          <div className="space-y-3">
            {comunicados.map((c) => (
              <article
                key={c.id}
                className="border rounded-xl bg-white p-3 sm:p-4 shadow-xs flex flex-col gap-1 text-sm"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-medium">{c.title}</h3>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs",
                      c.status === "open" && "bg-amber-50 text-amber-700",
                      c.status === "in_progress" && "bg-blue-50 text-blue-700",
                      c.status === "closed" && "bg-emerald-50 text-emerald-700"
                    )}
                  >
                    {c.status === "open"
                      ? "Pendiente"
                      : c.status === "in_progress"
                      ? "En revisión"
                      : "Cerrado"}
                  </span>
                </div>

                <p className="text-gray-700 whitespace-pre-line">
                  {c.message}
                </p>

                <p className="text-[11px] text-muted-foreground mt-1">
                  Enviado el{" "}
                  {new Date(c.created_at).toLocaleString("es-ES", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
