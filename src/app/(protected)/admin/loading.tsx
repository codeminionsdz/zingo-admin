import { getAdminMessages } from "@/i18n/messages";
import { getAdminLocale } from "@/lib/admin-locale";

export default async function AdminLoading() {
  const locale = await getAdminLocale();
  const messages = getAdminMessages(locale);

  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="shell admin-overview-page"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <p className="sr-only">{messages.overviewLoading}</p>
      <div aria-hidden="true" className="admin-loading-heading">
        <span />
        <span />
        <span />
      </div>
      <div aria-hidden="true" className="admin-loading-summary">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
