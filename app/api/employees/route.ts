import { NextResponse } from "next/server"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: employees, error } = await supabase
      .from("usuarios")
      .select("*")
      .order("full_name", { ascending: true })

    if (error) throw error

    return NextResponse.json(employees)
  } catch (error) {
    return NextResponse.json({ error: "Error fetching employees" }, { status: 500 })
  }
}
