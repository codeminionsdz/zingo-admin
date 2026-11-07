import type { AdminPrincipal } from "./assert-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Reads verified identity from Supabase Auth and admin grant from RLS-protected
 * database state. User metadata and route visibility are never authorization.
 */
export async function resolveAdminPrincipal(): Promise<AdminPrincipal | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return null;
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if (error || !data) return null;
    return {
      email: user.email ?? null,
      userId: user.id,
      roles: data
        .map(({ role }) => role)
        .filter(
          (role) =>
            role === "customer" || role === "professional" || role === "admin",
        ),
    };
  } catch {
    return null;
  }
}
