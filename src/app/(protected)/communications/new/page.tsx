import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { CommunicationComposer } from "../communication-composer";
import { assertAdminPrincipal } from "@/lib/auth/assert-admin";
import { resolveAdminPrincipal } from "@/lib/auth/resolve-admin-principal";
import { getAdminLocale } from "@/lib/admin-locale";
import { getAdminMessages } from "@/i18n/messages";

export const dynamic = "force-dynamic";

export default async function NewCommunicationPage() {
  const principal = await resolveAdminPrincipal();
  assertAdminPrincipal(principal);
  const locale = await getAdminLocale();
  const messages = getAdminMessages(locale);
  return (
    <main className="shell communications-page">
      <AdminPageHeader
        eyebrow={messages.communications}
        title={messages.communicationsCompose}
        subtitle={messages.communicationsSubtitle}
        action={
          <Link className="communications-back-link" href="/communications">
            {messages.communicationsBack}
          </Link>
        }
      />
      <CommunicationComposer locale={locale} messages={messages} />
    </main>
  );
}
