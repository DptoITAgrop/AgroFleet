// app/dashboard/page.ts
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { EmployeeDashboard } from "@/components/employee/employee-dashboard"

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient()

  // 1) Usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error("[v0] Error getting auth user:", authError)
    redirect("/login")
  }

  // 2) Cargar registro en public.usuarios (lo crea el trigger handle_new_user)
  const { data: employee, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (error) {
    console.error("[v0] Error loading employee:", error)
    redirect("/login")
  }

  if (!employee) {
    console.error("[v0] Employee not found for user id:", user.id)
    redirect("/login")
  }

  // 3) Si es admin, mandamos al panel de admin
  if (employee.is_admin) {
    redirect("/admin")
  }

  // 4) Si no es admin, panel normal
  return <EmployeeDashboard employee={employee} />
}
