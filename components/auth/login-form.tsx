"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === "Invalid login credentials") {
          setError("Credenciales inválidas. Verifica tu email y contraseña.")
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        const { data: employee } = await supabase
          .from("usuarios")
          .select("is_admin")
          .eq("id", data.user.id)
          .maybeSingle()

        if (!employee) {
          console.log("[v0] Employee not found, creating via API...")
          const response = await fetch("/api/auth/create-employee", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0] || "Usuario",
              department: "General",
              is_admin: false,
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            console.error("[v0] Error creating employee:", errorData)
            setError("Error al crear el perfil de usuario")
            return
          }

          const { employee: newEmployee } = await response.json()
          console.log("[v0] Employee created successfully:", newEmployee)

          // Redirect to employee dashboard for new users
          router.push("/dashboard")
        } else if (employee.is_admin) {
          router.push("/admin")
        } else {
          router.push("/dashboard")
        }
        router.refresh()
      }
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  const handleSSOLogin = async () => {
    try {
      setLoading(true)
      setError(null)

      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          scopes: "email",
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error
    } catch (err) {
      console.error("[v0] SSO error:", err)
      setError(err instanceof Error ? err.message : "Error al iniciar sesión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-2">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto">
          <Image src="/logo.png" alt="Agroptimum Logo" width={120} height={120} className="mx-auto" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold">AgroFleet</CardTitle>
          <CardDescription className="text-base mt-2">Sistema de Gestión de Flota</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@agroptimum.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 text-base">
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">O continuar con</span>
          </div>
        </div>

        <Button
          onClick={handleSSOLogin}
          disabled={loading}
          variant="outline"
          className="w-full h-11 text-base bg-transparent"
          size="lg"
        >
          {loading ? "Conectando..." : "Iniciar sesión con Entra ID"}
        </Button>
        {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md text-center">{error}</div>}
        <p className="text-xs text-muted-foreground text-center">
          Utiliza tu cuenta corporativa de Microsoft para acceder
        </p>
      </CardContent>
    </Card>
  )
}
