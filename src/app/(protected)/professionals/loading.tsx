import { getAdminMessages } from "@/i18n/messages";
import { getAdminLocale } from "@/lib/admin-locale";

export default async function ProfessionalsLoading() {
  const locale = await getAdminLocale();
  const messages = getAdminMessages(locale);
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="shell professionals-queue-page"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <p className="sr-only">{messages.queueLoading}</p>
      <div aria-hidden="true" className="professional-detail-skeleton">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
