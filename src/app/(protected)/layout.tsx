import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { assertAdminPrincipal } from "@/lib/auth/assert-admin";
import { resolveAdminPrincipal } from "@/lib/auth/resolve-admin-principal";
import { AdminAppShell } from "@/components/admin-app-shell";
import { getAdminLocale } from "@/lib/admin-locale";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const principal = await resolveAdminPrincipal();
  if (!principal) redirect("/login");

  try {
    assertAdminPrincipal(principal);
  } catch {
    return redirect("/login?error=forbidden");
  }
  const locale = await getAdminLocale();
  return (
    <AdminAppShell email={principal.email ?? null} locale={locale}>
      {children}
    </AdminAppShell>
  );
}
