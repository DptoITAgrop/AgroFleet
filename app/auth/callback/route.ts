import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = await getSupabaseServerClient()
    await supabase.auth.exchangeCodeForSession(code)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: employee } = await supabase.from("usuarios").select("id").eq("id", user.id).maybeSingle()

      if (!employee) {
        await supabase.from("usuarios").insert({
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario",
          is_admin: false,
        })
      }
    }
  }

  return NextResponse.redirect(new URL("/", requestUrl.origin))
}
