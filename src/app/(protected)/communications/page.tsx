import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { assertAdminPrincipal } from "@/lib/auth/assert-admin";
import { resolveAdminPrincipal } from "@/lib/auth/resolve-admin-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminLocale } from "@/lib/admin-locale";
import { getAdminMessages } from "@/i18n/messages";

export const dynamic = "force-dynamic";

function date(value: string | null, locale: "fr" | "ar") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export default async function CommunicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const principal = await resolveAdminPrincipal();
  assertAdminPrincipal(principal);
  const [{ page: rawPage }, locale, supabase] = await Promise.all([
    searchParams,
    getAdminLocale(),
    createSupabaseServerClient(),
  ]);
  const parsedPage = Number(rawPage ?? "1");
  const page =
    Number.isInteger(parsedPage) && parsedPage > 0
      ? Math.min(parsedPage, 1000)
      : 1;
  const messages = getAdminMessages(locale);
  const { data, error } = await supabase.rpc(
    "admin_list_communication_messages",
    {
      target_limit: 50,
      target_page: page,
    },
  );

  return (
    <main className="shell communications-page">
      <AdminPageHeader
        eyebrow={messages.communications}
        title={messages.communicationsTitle}
        subtitle={messages.communicationsSubtitle}
        action={
          <Link className="button button-primary" href="/communications/new">
            {messages.communicationsCompose}
          </Link>
        }
      />
      <section className="communications-history">
        <h2>{messages.communicationsHistory}</h2>
        {error ? (
          <p className="communication-error" role="alert">
            {messages.communicationsSendError}
          </p>
        ) : null}
        {!error && !data?.length ? (
          <p className="communications-empty">
            {messages.communicationsNoHistory}
          </p>
        ) : null}
        <div className="communications-message-list">
          {(data ?? []).map((message) => (
            <Link
              className="communications-message-card"
              href={`/communications/${message.id}`}
              key={message.id}
            >
              <div className="communications-message-title">
                <strong>{message.title}</strong>
                <span>
                  {message.language === "ar"
                    ? messages.communicationsArabic
                    : messages.communicationsFrench}
                </span>
              </div>
              <div className="communications-message-meta">
                <span>
                  {message.message_type === "operational"
                    ? messages.communicationsOperational
                    : messages.communicationsAnnouncement}
                </span>
                <span>
                  {message.audience === "professional"
                    ? messages.communicationsProfessionals
                    : messages.communicationsCustomers}
                </span>
                <span>
                  {messages.communicationsIntended}: {message.intended_count}
                </span>
                <time dateTime={message.sent_at ?? message.created_at}>
                  {date(message.sent_at ?? message.created_at, locale)}
                </time>
              </div>
              <div className="communications-delivery-summary">
                <span>
                  {messages.communicationsInAppPersisted}:{" "}
                  {message.in_app_count}
                </span>
                <span>
                  {messages.communicationsPushQueued}:{" "}
                  {message.push_queued_count}
                </span>
                <span>
                  {messages.communicationsPushDelivered}:{" "}
                  {message.push_delivered_count}
                </span>
                <span>
                  {messages.communicationsPushFailed}:{" "}
                  {message.push_failed_count}
                </span>
                <span>
                  {messages.communicationsPushAccepted}:{" "}
                  {message.push_accepted_count}
                </span>
                <span>
                  {messages.communicationsPushRejected}:{" "}
                  {message.push_ticket_rejected_count}
                </span>
                <span>
                  {messages.communicationsPushNotQueued}:{" "}
                  {message.push_not_queued_count}
                </span>
              </div>
            </Link>
          ))}
        </div>
        {data?.length ? (
          <nav
            className="communication-pagination"
            aria-label={messages.communicationsHistory}
          >
            {page > 1 ? (
              <Link href={`/communications?page=${page - 1}`}>
                {messages.previousPage}
              </Link>
            ) : (
              <span />
            )}
            {data[data.length - 1]?.has_next_page ? (
              <Link href={`/communications?page=${page + 1}`}>
                {messages.nextPage}
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </main>
  );
}
