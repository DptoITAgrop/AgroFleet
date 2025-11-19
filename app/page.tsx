import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export default async function HomePage() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: employee } = await supabase.from("usuarios").select("is_admin").eq("id", user.id).single()

  if (employee?.is_admin) {
    redirect("/admin")
  } else {
    redirect("/dashboard")
  }
}
