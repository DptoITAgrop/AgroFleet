"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

import {
  LayoutDashboard,
  Car,
  Calendar,
  Wrench,
  AlertCircle,
  Users,
  LogOut,
  Menu,
  X,
  Megaphone,
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { ComunicadosBadge } from "./comunicados-badge"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Vehículos", href: "/admin/vehicles", icon: Car },
  { name: "Reservas", href: "/admin/bookings", icon: Calendar },
  { name: "Mantenimiento", href: "/admin/maintenance", icon: Wrench },
  { name: "Multas", href: "/admin/fines", icon: AlertCircle },
  { name: "Empleados", href: "/admin/employees", icon: Users },
  // 👇 NUEVO
  { name: "Comunicados", href: "/admin/comunicados", icon: Megaphone },
]

  { name: "Localización", href: "/admin/localizacion", icon: MapPin },
  { name: "Historial", href: "/admin/history", icon: Route }, // ✅
  { name: "Comunicados", href: "/admin/comunicados", icon: Megaphone },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Agroptimum" width={40} height={40} className="rounded-lg" />
              <div>
                <h1 className="font-bold text-lg">Fleet Manager</h1>
                <p className="text-xs text-muted-foreground">Panel de Administración</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const isComunicados = item.href === "/admin/comunicados"

              return (
                <Link key={item.name} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start ${
                      isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
                    }`}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}

                    {/* badge sólo para Comunicados */}
                    {isComunicados && <ComunicadosBadge />}
                  </Button>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
