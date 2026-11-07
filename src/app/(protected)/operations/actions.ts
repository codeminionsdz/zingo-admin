"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { assertAdminPrincipal } from "@/lib/auth/assert-admin";
import { resolveAdminPrincipal } from "@/lib/auth/resolve-admin-principal";

export async function refreshOperationsOverview() {
  const principal = await resolveAdminPrincipal();
  if (!principal || !principal.roles.includes("admin")) {
    redirect("/login?error=forbidden");
  }

  assertAdminPrincipal(principal);
  revalidatePath("/operations");
  redirect("/operations");
}
