// app/api/admin/overview/route.ts
import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await getSupabaseServerClient()

  // auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // admin?
  const { data: u } = await supabase
    .from("usuarios")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle()

  if (!u?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const nowISO = new Date().toISOString()

  // 1) próximas reservas (desde ahora en adelante), con join de empleado y vehículo
  const { data: upcoming, error: e1 } = await supabase
    .from("reservas")
    .select(`
      id, start_date, end_date, status,
      employee:usuarios(id, full_name, email),
      vehicle:vehiculos(id, license_plate, brand, model, year)
    `)
    .gte("start_date", nowISO)
    .order("start_date", { ascending: true })
    .limit(8)

  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 })

  // 2) reservas activas ahora (start <= now < end y status != cancelled)
  const { count: activeCount, error: e2 } = await supabase
    .from("reservas")
    .select("id", { count: "exact", head: true })
    .lte("start_date", nowISO)
    .gt("end_date", nowISO)
    .neq("status", "cancelled")

  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 })

  // 3) vehículos disponibles (si tienes columna status en vehiculos)
  const { count: availableVehicles, error: e3 } = await supabase
    .from("vehiculos")
    .select("id", { count: "exact", head: true })
    .eq("status", "available")

  if (e3) return NextResponse.json({ error: e3.message }, { status: 500 })

  return NextResponse.json({
    metrics: {
      activeCount: activeCount ?? 0,
      availableVehicles: availableVehicles ?? 0,
    },
    upcoming: upcoming ?? [],
  })
}
