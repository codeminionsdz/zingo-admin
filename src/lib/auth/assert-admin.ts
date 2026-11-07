import type { AppRole } from "@/lib/shared/database";

export type AdminPrincipal = {
  email?: string | null;
  userId: string;
  roles: readonly AppRole[];
};

/**
 * Authorization helper. Pass only a principal verified by the server-side
 * session resolver; this function does not authenticate users itself.
 */
export function assertAdminPrincipal(
  principal: AdminPrincipal | null,
): asserts principal is AdminPrincipal {
  if (!principal || !principal.roles.includes("admin")) {
    throw new Error("Forbidden: a verified administrator session is required.");
  }
}
