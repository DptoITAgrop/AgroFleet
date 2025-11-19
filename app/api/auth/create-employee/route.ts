// app/api/auth/create-employee/route.ts
import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient()

    // 1) Usuario autenticado actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("[v0] No auth user in create-employee:", userError)
      return NextResponse.json({ error: "No authenticated user" }, { status: 401 })
    }

    // 2) Mirar si ya existe en "usuarios"
    const { data: existing, error: selectError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (selectError) {
      console.error("[v0] Error selecting usuario:", selectError)
      return NextResponse.json({ error: "Error fetching usuario" }, { status: 500 })
    }

    if (existing) {
      // Ya está sincronizado, devolvemos el registro
      return NextResponse.json(existing)
    }

    // 3) Crear registro en "usuarios" (no usar ninguna función SQL antigua)
    const { data: newEmployee, error: insertError } = await supabase
      .from("usuarios")
      .insert({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario",
        is_admin: false, // por defecto NO admin
      })
      .select()
      .single()

    if (insertError || !newEmployee) {
      console.error("[v0] Error inserting usuario:", insertError)
      return NextResponse.json({ error: "Error creating usuario" }, { status: 500 })
    }

    return NextResponse.json(newEmployee)
  } catch (e) {
    console.error("[v0] Unexpected error in create-employee:", e)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
