import { getSupabaseServerClient } from "@/lib/supabase/server"
import { BookingList } from "@/components/bookings/booking-list"
import { redirect } from "next/navigation"

export default async function EmployeeBookingsPage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mis Reservas</h1>
        <p className="text-muted-foreground mt-1">Gestiona tus reservas de vehículos</p>
      </div>
      <BookingList employeeId={user.id} isAdmin={false} />
    </div>
  )
}
