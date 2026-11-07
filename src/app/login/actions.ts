"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInAdmin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=credentials");
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) redirect("/login?error=credentials");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login?error=credentials");
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    if (!roles?.some(({ role }) => role === "admin")) {
      await supabase.auth.signOut();
      redirect("/login?error=forbidden");
    }
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    redirect("/login?error=unavailable");
  }
  redirect("/admin");
}
