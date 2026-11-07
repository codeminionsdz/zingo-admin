import Link from "next/link";

import { AdminPageHeader } from "@/components/admin-page-header";
import { getAdminLocale } from "@/lib/admin-locale";
import {
  readOperationsAuditLog,
  type OperationsAuditResult,
} from "@/lib/admin-operations";
import { getAdminMessages } from "@/i18n/messages";

function formatDateTime(value: string, locale: "fr" | "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

function summarizeEventContext(value: Record<string, unknown> | null) {
  if (!value || Object.keys(value).length === 0) return "—";
  return Object.entries(value)
    .slice(0, 3)
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join(" • ");
}

export default async function OperationsAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    page?: string;
    q?: string;
  }>;
}) {
  const [params, locale] = await Promise.all([searchParams, getAdminLocale()]);
  const messages = getAdminMessages(locale);
  const q = (params.q ?? "").trim();
  const action = params.action ?? "all";
  const page = Number.parseInt(params.page ?? "1", 10);
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;

  const result = await readOperationsAuditLog({
    action,
    page: String(safePage),
    q,
  });

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
          eyebrow={messages.operations}
          subtitle={messages.operationsAuditSubtitle}
          title={messages.operationsAuditTitle}
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

  const auditResult = result as Extract<
    OperationsAuditResult,
    { status: "success" }
  >;
  const actionOptions = Array.from(
    new Set(
      auditResult.items
        .map((item: { action: string }) => item.action)
        .filter((value: string) => Boolean(value)),
    ),
  );

  return (
    <main className="shell operations-page">
      <AdminPageHeader
        eyebrow={messages.operations}
        subtitle={messages.operationsAuditSubtitle}
        title={messages.operationsAuditTitle}
      />

      <p className="admin-updated-at">
        <span>{messages.updatedAt}</span>
        <time dateTime={auditResult.checkedAt} dir="auto">
          {formatDateTime(auditResult.checkedAt, locale)}
        </time>
      </p>

      <form className="operations-audit-filters" method="get">
        <label>
          <span>{messages.operationsAuditSearchLabel}</span>
          <input
            defaultValue={q}
            name="q"
            placeholder={messages.operationsAuditSearchPlaceholder}
            type="search"
          />
        </label>
        <label>
          <span>{messages.operationsAuditActionLabel}</span>
          <select defaultValue={action} name="action">
            <option value="all">{messages.operationsAuditAllActions}</option>
            {actionOptions.map((candidate: string) => (
              <option key={candidate} value={candidate}>
                {candidate}
              </option>
            ))}
          </select>
        </label>
        <button className="admin-refresh-button" type="submit">
          {messages.applyFilters}
        </button>
      </form>

      {auditResult.items.length === 0 ? (
        <section className="operations-card" role="status">
          <h2>{messages.operationsAuditNoResults}</h2>
          <p className="operations-empty-copy">
            {messages.operationsAuditEmpty}
          </p>
        </section>
      ) : (
        <>
          <div className="operations-audit-meta">
            <span>
              {auditResult.items.length} {messages.operationsAuditResultCount}
            </span>
            <Link className="operations-inline-link" href="/operations">
              {messages.operationsOverviewTitle}
            </Link>
          </div>

          <div className="operations-table-wrap">
            <table className="operations-audit-table">
              <thead>
                <tr>
                  <th>{messages.operationsAuditEvent}</th>
                  <th>{messages.operationsAuditActor}</th>
                  <th>{messages.operationsAuditProfessional}</th>
                  <th>{messages.operationsAuditSubscription}</th>
                  <th>{messages.operationsAuditContext}</th>
                  <th>{messages.operationsAuditTimestamp}</th>
                </tr>
              </thead>
              <tbody>
                {auditResult.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.action}</td>
                    <td>{item.actorUserId ?? messages.informationMissing}</td>
                    <td>
                      {item.professionalUserId ?? messages.informationMissing}
                    </td>
                    <td>
                      {item.subscriptionId ?? messages.informationMissing}
                    </td>
                    <td>{summarizeEventContext(item.details)}</td>
                    <td>
                      <time dateTime={item.createdAt} dir="auto">
                        {formatDateTime(item.createdAt, locale)}
                      </time>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="operations-pagination">
            {auditResult.page > 1 && (
              <Link
                href={`/operations/audit?q=${encodeURIComponent(q)}&action=${encodeURIComponent(action)}&page=${auditResult.page - 1}`}
              >
                {messages.previousPage}
              </Link>
            )}
            {auditResult.hasNextPage && (
              <Link
                href={`/operations/audit?q=${encodeURIComponent(q)}&action=${encodeURIComponent(action)}&page=${auditResult.page + 1}`}
              >
                {messages.nextPage}
              </Link>
            )}
          </div>
        </>
      )}
    </main>
  );
}
