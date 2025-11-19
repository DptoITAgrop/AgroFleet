// components/employee/employee-sidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Car,
  CalendarDays,
  MessageCircle,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const navigation = [
  { name: "Inicio", href: "/dashboard", icon: LayoutDashboard },
  { name: "Vehículos", href: "/dashboard/vehicles", icon: Car }, // 👈 MISMA VISTA QUE “VER TODOS”
  { name: "Mis Reservas", href: "/bookings", icon: CalendarDays },
  { name: "Comunicados", href: "/comunicados", icon: MessageCircle },
];

export function EmployeeSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <>
      {/* Botón hamburguesa en móvil */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header con logo */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Agroptimum"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div>
                <h1 className="font-bold text-lg">AgroFleet</h1>
                <p className="text-xs text-muted-foreground">
                  Panel de Empleado
                </p>
              </div>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start ${
                      isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : ""
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Cerrar sesión */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Fondo oscuro cuando el menú móvil está abierto */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
