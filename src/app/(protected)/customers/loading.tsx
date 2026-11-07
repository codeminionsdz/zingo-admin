import { getAdminMessages } from "@/i18n/messages";
import { getAdminLocale } from "@/lib/admin-locale";

export default async function CustomersLoading() {
  const locale = await getAdminLocale();
  const messages = getAdminMessages(locale);
  return (
    <main aria-busy="true" className="shell support-lookup-page">
      <p className="sr-only">{messages.customerSearchPromptTitle}</p>
      <div aria-hidden="true" className="support-loading-skeleton">
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}
