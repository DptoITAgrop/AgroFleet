import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function getSessionAndRole() {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false };

  const { data: me } = await supabase
    .from("usuarios")
    .select("is_admin, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  return { user, isAdmin: !!me?.is_admin };
}
