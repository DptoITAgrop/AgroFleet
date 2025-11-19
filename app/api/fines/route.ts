// app/api/fines/route.ts
import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from("fine") // tu tabla de multas
      .select(
        `
        *,
        vehicle:vehiculos(license_plate),
        employee:usuarios(full_name, email)
      `,
      )
      .order("fine_date", { ascending: false })

    if (error) throw error

    // Siempre devolvemos un array
    return NextResponse.json(data ?? [])
  } catch (e) {
    console.error("GET /api/fines error", e)
    // Devolvemos siempre un array aunque haya fallo
    return NextResponse.json([], { status: 500 })
  }
}
