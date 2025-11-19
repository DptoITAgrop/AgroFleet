// app/admin/page.tsx
import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import AdminHome from "@/components/admin/admin-home"

export default async function AdminPage() {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return redirect("/login")

  // Comprobamos que el usuario es admin
  const { data: me } = await supabase
    .from("usuarios")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!me?.is_admin) {
    return <div className="p-8">No tienes permisos.</div>
  }

  // ✅ Usamos la URL base del .env, nada de headers()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"

  const res = await fetch(`${baseUrl}/api/admin/overview`, {
    cache: "no-store",
  })

  const overview = res.ok
    ? await res.json()
    : { metrics: { activeCount: 0, availableVehicles: 0 }, upcoming: [] }

  return <AdminHome initialOverview={overview} />
}
