// app/api/maintenance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// 👉 LISTAR mantenimientos (con info del vehículo)
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from("mantenimiento")
      .select(
        `
        id,
        vehicle_id,
        maintenance_type,
        description,
        status,
        notes,
        start_date,
        end_date,
        created_at,
        updated_at,
        vehicle:vehiculos (
          id,
          license_plate,
          brand,
          model,
          year,
          status
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data ?? [], { status: 200 });
  } catch (e: any) {
    console.error("GET /api/maintenance error", e);
    return NextResponse.json(
      { error: e?.message || "Error obteniendo mantenimientos" },
      { status: 500 }
    );
  }
}

// 👉 Crear mantenimiento (entra al taller)
// Además marcamos el vehículo como "maintenance"
export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await req.json();
    const { vehicle_id, description, notes, start_date } = body || {};

    if (!vehicle_id) {
      return NextResponse.json(
        { error: "vehicle_id es obligatorio" },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Si no viene start_date desde el cliente, usamos ahora mismo
    const startDateIso =
      start_date ? new Date(start_date).toISOString() : new Date().toISOString();

    // 1) Crear mantenimiento
    const { data: maintenance, error } = await supabase
      .from("mantenimiento")
      .insert({
        vehicle_id,
        maintenance_type: "workshop", // tipo genérico: taller
        description: description ?? null,
        status: "in_progress", // o "scheduled", como prefieras
        notes: notes ?? null,
        created_by: user?.id ?? null,
        start_date: startDateIso,      // 👈 IMPRESCINDIBLE
      })
      .select(
        `
        id,
        vehicle_id,
        maintenance_type,
        description,
        status,
        notes,
        start_date,
        end_date,
        created_at,
        updated_at,
        vehicle:vehiculos (
          id,
          license_plate,
          brand,
          model,
          year,
          status
        )
      `
      )
      .single();

    if (error) throw error;

    // 2) Marcar vehículo como en mantenimiento
    const { error: vehError } = await supabase
      .from("vehiculos")
      .update({ status: "maintenance" })
      .eq("id", vehicle_id);

    if (vehError) throw vehError;

    return NextResponse.json(maintenance, { status: 200 });
  } catch (e: any) {
    console.error("POST /api/maintenance error", e);
    return NextResponse.json(
      { error: e?.message || "Error creando mantenimiento" },
      { status: 500 }
    );
  }
}

// 👉 Cerrar mantenimiento (sale del taller)
// Marcamos el mantenimiento como "completed"
// y el vehículo vuelve a "available"
export async function PUT(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const body = await req.json();
    const { maintenance_id, vehicle_id, end_date } = body || {};

    if (!maintenance_id) {
      return NextResponse.json(
        { error: "maintenance_id es obligatorio" },
        { status: 400 }
      );
    }

    const endDateIso =
      end_date ? new Date(end_date).toISOString() : new Date().toISOString();

    // 1) Actualizar mantenimiento
    const { data: maintenance, error } = await supabase
      .from("mantenimiento")
      .update({
        status: "completed",
        end_date: endDateIso,   // 👈 marcamos fecha de salida del taller
      })
      .eq("id", maintenance_id)
      .select(
        `
        id,
        vehicle_id,
        maintenance_type,
        description,
        status,
        notes,
        start_date,
        end_date,
        created_at,
        updated_at,
        vehicle:vehiculos (
          id,
          license_plate,
          brand,
          model,
          year,
          status
        )
      `
      )
      .single();

    if (error) throw error;

    // 2) Devolver el vehículo a "available"
    const vehId = vehicle_id ?? maintenance?.vehicle_id;

    if (vehId) {
      const { error: vehError } = await supabase
        .from("vehiculos")
        .update({ status: "available" })
        .eq("id", vehId);

      if (vehError) throw vehError;
    }

    return NextResponse.json(maintenance, { status: 200 });
  } catch (e: any) {
    console.error("PUT /api/maintenance error", e);
    return NextResponse.json(
      { error: e?.message || "Error actualizando mantenimiento" },
      { status: 500 }
    );
  }
}
