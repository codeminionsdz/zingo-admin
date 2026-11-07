import { getAdminMessages } from "@/i18n/messages";
import { getAdminLocale } from "@/lib/admin-locale";

export default async function BookingDetailLoading() {
  const locale = await getAdminLocale();
  const messages = getAdminMessages(locale);
  return (
    <main aria-busy="true" className="shell support-detail-page">
      <p className="sr-only">{messages.bookingDetailTitle}</p>
      <div aria-hidden="true" className="support-loading-skeleton">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
