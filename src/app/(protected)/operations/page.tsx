import Link from "next/link";

import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminRefreshButton } from "@/components/admin-refresh-button";
import { getAdminLocale } from "@/lib/admin-locale";
import {
  readOperationsOverview,
  type OperationsOverviewResult,
} from "@/lib/admin-operations";
import { getAdminMessages } from "@/i18n/messages";

import { refreshOperationsOverview } from "./actions";

function formatDateTime(value: string, locale: "fr" | "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

function formatNumber(value: number, locale: "fr" | "ar") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-DZ").format(
    value,
  );
}

export default async function OperationsPage() {
  const [locale, result] = await Promise.all([
    getAdminLocale(),
    readOperationsOverview(),
  ]);
  const messages = getAdminMessages(locale);

  if (result.status === "denied") {
    return (
      <main className="shell operations-page">
        <AdminPageHeader
          eyebrow={messages.operations}
          subtitle={messages.accessDeniedDescription}
          title={messages.accessDeniedTitle}
        />
      </main>
    );
  }

  if (result.status === "error") {
    return (
      <main className="shell operations-page">
        <AdminPageHeader
          action={
            <form action={refreshOperationsOverview}>
              <AdminRefreshButton
                ariaLabel={messages.refreshDescription}
                className="admin-refresh-button"
                label={messages.retry}
                pendingLabel={messages.refreshing}
                showIcon
              />
            </form>
          }
          eyebrow={messages.operations}
          subtitle={messages.operationsOverviewSubtitle}
          title={messages.operationsOverviewTitle}
        />
        <section className="admin-overview-state is-error" role="alert">
          <div className="admin-state-mark" aria-hidden="true">
            !
          </div>
          <div>
            <h2>{messages.overviewErrorTitle}</h2>
            <p>{messages.overviewErrorDescription}</p>
          </div>
        </section>
      </main>
    );
  }

  const overview = result as Extract<
    OperationsOverviewResult,
    { status: "success" }
  >;
  const bookingStatusLabels: Record<string, string> = {
    pending: messages.bookingStatus_pending,
    confirmed: messages.bookingStatus_confirmed,
    rejected: messages.bookingStatus_rejected,
    cancelled: messages.bookingStatus_cancelled,
  };

  return (
    <main className="shell operations-page">
      <AdminPageHeader
        action={
          <form action={refreshOperationsOverview}>
            <AdminRefreshButton
              ariaLabel={messages.refreshDescription}
              className="admin-refresh-button"
              label={messages.refresh}
              pendingLabel={messages.refreshing}
              showIcon
            />
          </form>
        }
        eyebrow={messages.operations}
        subtitle={messages.operationsOverviewSubtitle}
        title={messages.operationsOverviewTitle}
      />

      <p className="admin-updated-at">
        <span>{messages.updatedAt}</span>
        <time dateTime={overview.checkedAt} dir="auto">
          {formatDateTime(overview.checkedAt, locale)}
        </time>
      </p>

      <div className="operations-overview-grid">
        <article className="operations-stat-card">
          <span className="operations-stat-label">
            {messages.operationsPendingPaymentProofs}
          </span>
          <strong>{formatNumber(overview.pendingPaymentProofs, locale)}</strong>
          <span className="operations-stat-hint">
            {messages.operationsSubscriptionOverview}
          </span>
        </article>

        <article className="operations-stat-card">
          <span className="operations-stat-label">
            {messages.operationsActiveSubscriptions}
          </span>
          <strong>{formatNumber(overview.activeSubscriptions, locale)}</strong>
          <span className="operations-stat-hint">
            {messages.operationsSubscriptionOverview}
          </span>
        </article>
      </div>

      <section className="operations-card">
        <h2>{messages.operationsBookingStatusSummary}</h2>
        <div className="operations-status-grid">
          {Object.entries(overview.bookingCounts).map(([status, count]) => (
            <div className="operations-status-item" key={status}>
              <span>{bookingStatusLabels[status] ?? status}</span>
              <strong>{formatNumber(Number(count), locale)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="operations-card">
        <div className="operations-card-header">
          <h2>{messages.operationsRecentBookingEvents}</h2>
          <Link className="operations-inline-link" href="/bookings">
            {messages.bookings}
          </Link>
        </div>

        {overview.recentBookingEvents.length === 0 ? (
          <p className="operations-empty-copy">
            {messages.operationsNoRecentEvents}
          </p>
        ) : (
          <ul className="operations-list">
            {overview.recentBookingEvents.map((event) => (
              <li key={event.id}>
                <strong>{event.eventType}</strong>
                <span>{event.bookingId}</span>
                <time dateTime={event.createdAt} dir="auto">
                  {formatDateTime(event.createdAt, locale)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="operations-card">
        <div className="operations-card-header">
          <h2>{messages.operationsAuditTrail}</h2>
          <Link className="operations-inline-link" href="/operations/audit">
            {messages.operationsAuditLink}
          </Link>
        </div>

        {overview.recentAuditEvents.length === 0 ? (
          <p className="operations-empty-copy">
            {messages.operationsAuditEmpty}
          </p>
        ) : (
          <ul className="operations-list">
            {overview.recentAuditEvents.map((event) => (
              <li key={event.id}>
                <strong>{event.action}</strong>
                <span>{event.actorUserId ?? messages.informationMissing}</span>
                <time dateTime={event.createdAt} dir="auto">
                  {formatDateTime(event.createdAt, locale)}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
