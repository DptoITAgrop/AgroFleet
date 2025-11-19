import { getSupabaseServerClient } from "@/lib/supabase/server"
import { AdminBookingsList } from "@/components/admin/admin-bookings-list"

export default async function AdminBookingsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Reservas</h1>
        <p className="text-muted-foreground mt-1">Visualiza y gestiona todas las reservas</p>
      </div>
      <AdminBookingsList />
    </div>
  )
}
