"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_LOCALE_COOKIE } from "@/lib/admin-locale";
import { isAdminLocale } from "@/i18n/messages";

const protectedRoutes = ["/admin", "/subscriptions", "/login"];

function safeReturnPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/admin";
  return protectedRoutes.find(
    (route) => value === route || value.startsWith(`${route}/`),
  )
    ? value
    : "/admin";
}

export async function setAdminLocale(formData: FormData) {
  const locale = formData.get("locale");
  if (typeof locale !== "string" || !isAdminLocale(locale)) {
    redirect("/admin");
  }

  (await cookies()).set(ADMIN_LOCALE_COOKIE, locale, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect(safeReturnPath(formData.get("returnTo")));
}
