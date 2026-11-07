import "server-only";

import { cookies } from "next/headers";
import { isAdminLocale, type AdminLocale } from "@/i18n/messages";

export const ADMIN_LOCALE_COOKIE = "zingo-admin-locale";

export async function getAdminLocale(): Promise<AdminLocale> {
  const value = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return value && isAdminLocale(value) ? value : "fr";
}
