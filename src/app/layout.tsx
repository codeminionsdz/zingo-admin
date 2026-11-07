import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getAdminLocale } from "@/lib/admin-locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZinGo Admin",
  description: "ZinGo administration foundation",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getAdminLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>{children}</body>
    </html>
  );
}
