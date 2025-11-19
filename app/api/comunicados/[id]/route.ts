// app/api/comunicados/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: { id: string };
}

// PATCH: actualizar estado / contenido (solo admin)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id } = params;
    const body = await req.json();
    const { title, message, status } = body || {};

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: me, error: meErr } = await supabase
      .from("usuarios")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (meErr) throw meErr;
    if (!me?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("comunicados")
      .update({
        ...(title !== undefined ? { title } : {}),
        ...(message !== undefined ? { message } : {}),
        ...(status !== undefined ? { status } : {}),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (e: any) {
    console.error("PATCH /api/comunicados/[id] error", e);
    return NextResponse.json(
      { error: e?.message || "Error actualizando comunicado" },
      { status: 500 }
    );
  }
}

// DELETE: borrar comunicado (solo admin)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await getSupabaseServerClient();
    const { id } = params;

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: me, error: meErr } = await supabase
      .from("usuarios")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();
    if (meErr) throw meErr;
    if (!me?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("comunicados")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    console.error("DELETE /api/comunicados/[id] error", e);
    return NextResponse.json(
      { error: e?.message || "Error borrando comunicado" },
      { status: 500 }
    );
  }
}
