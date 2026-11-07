import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-page-header";
import { assertAdminPrincipal } from "@/lib/auth/assert-admin";
import { resolveAdminPrincipal } from "@/lib/auth/resolve-admin-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminLocale } from "@/lib/admin-locale";
import { getAdminMessages } from "@/i18n/messages";

export const dynamic = "force-dynamic";

export default async function CommunicationDetailPage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const principal = await resolveAdminPrincipal();
  assertAdminPrincipal(principal);
  const [{ messageId }, locale, supabase] = await Promise.all([
    params,
    getAdminLocale(),
    createSupabaseServerClient(),
  ]);
  const { data, error } = await supabase.rpc(
    "admin_get_communication_message",
    {
      target_message_id: messageId,
    },
  );
  if (error || !data?.[0]) notFound();
  const message = data[0];
  const messages = getAdminMessages(locale);
  const count = new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-DZ");
  const date = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Africa/Algiers",
        }).format(new Date(value))
      : "—";

  const rows = [
    [messages.communicationsIntended, message.intended_count],
    [messages.communicationsInAppPersisted, message.in_app_count],
    [messages.communicationsPushQueued, message.push_queued_count],
    [messages.communicationsPushAccepted, message.push_accepted_count],
    [messages.communicationsPushDelivered, message.push_delivered_count],
    [messages.communicationsPushFailed, message.push_failed_count],
    [messages.communicationsPushPending, message.push_pending_count],
    [messages.communicationsPushNoDevices, message.push_no_device_count],
    [messages.communicationsPushRejected, message.push_ticket_rejected_count],
    [
      messages.communicationsPushDispatchFailed,
      message.push_dispatch_failed_count,
    ],
    [messages.communicationsPushNotQueued, message.push_not_queued_count],
  ] as const;

  return (
    <main className="shell communications-page">
      <AdminPageHeader
        eyebrow={messages.communicationsDetails}
        title={message.title}
        subtitle={`${message.audience === "professional" ? messages.communicationsProfessionals : messages.communicationsCustomers} · ${message.language === "ar" ? messages.communicationsArabic : messages.communicationsFrench}`}
        action={
          <Link className="communications-back-link" href="/communications">
            {messages.communicationsBack}
          </Link>
        }
      />
      <article
        className="communication-detail-message"
        lang={message.language}
        dir="auto"
      >
        <p>{message.body}</p>
      </article>
      <section
        className="communication-stats-grid"
        aria-label={messages.communicationsDetails}
      >
        {rows.map(([label, value]) => (
          <article className="communication-stat" key={label}>
            <span>{label}</span>
            <strong>{count.format(value)}</strong>
          </article>
        ))}
      </section>
      <section className="communication-detail-meta">
        <p>
          <strong>{messages.communicationsCreatedAt}:</strong>{" "}
          {date(message.created_at)}
        </p>
        <p>
          <strong>{messages.communicationsSentAt}:</strong>{" "}
          {date(message.sent_at)}
        </p>
        <p>
          <strong>{messages.communicationsRecipientMode}:</strong>{" "}
          {message.targeting.mode === "all"
            ? messages.communicationsAll
            : messages.communicationsSelected}
        </p>
        {message.targeting.status ? (
          <p>
            <strong>{messages.communicationsStatus}:</strong>{" "}
            {String(message.targeting.status)}
          </p>
        ) : null}
        {message.targeting.wilaya_code ? (
          <p>
            <strong>{messages.communicationsWilaya}:</strong>{" "}
            {String(message.targeting.wilaya_code).padStart(2, "0")}
          </p>
        ) : null}
      </section>
    </main>
  );
}
