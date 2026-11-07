"use client";

import { getAdminMessages, type AdminLocale } from "@/i18n/messages";
import { setAdminLocale } from "@/app/(protected)/locale-actions";

type AdminLocaleSwitcherProps = {
  locale: AdminLocale;
  returnTo: string;
};

export function AdminLocaleSwitcher({
  locale,
  returnTo,
}: AdminLocaleSwitcherProps) {
  const messages = getAdminMessages(locale);

  return (
    <form action={setAdminLocale} className="admin-locale-switcher">
      <input name="returnTo" type="hidden" value={returnTo} />
      <span className="sr-only">{messages.localeLabel}</span>
      <button
        aria-pressed={locale === "fr"}
        name="locale"
        type="submit"
        value="fr"
      >
        {messages.french}
      </button>
      <button
        aria-pressed={locale === "ar"}
        name="locale"
        type="submit"
        value="ar"
      >
        {messages.arabic}
      </button>
    </form>
  );
}
