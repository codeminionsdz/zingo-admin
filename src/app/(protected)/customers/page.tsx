import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { getAdminMessages } from "@/i18n/messages";
import { getAdminLocale } from "@/lib/admin-locale";
import {
  formatAdminDate,
  parseCustomerSearchInput,
} from "@/lib/support-lookup-input";
import { readCustomerSearch } from "@/lib/support-lookups";

export const dynamic = "force-dynamic";

function customerPageUrl(query: string, page: number) {
  const params = new URLSearchParams({ q: query, page: String(page) });
  return `/customers?${params.toString()}`;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const [params, locale] = await Promise.all([searchParams, getAdminLocale()]);
  const messages = getAdminMessages(locale);
  const query = (params.q ?? "").trim();
  const hasQuery = query.length > 0;
  const parsed = hasQuery ? parseCustomerSearchInput(query, params.page) : null;
  const result =
    parsed?.valid === true
      ? await readCustomerSearch({
          query: parsed.query,
          page: String(parsed.page),
        })
      : null;

  return (
    <main className="shell support-lookup-page">
      <AdminPageHeader
        eyebrow={messages.customerLookupEyebrow}
        subtitle={messages.customerLookupSubtitle}
        title={messages.customerLookupTitle}
      />
      <p className="support-read-only-note" role="note">
        {messages.supportReadOnlyNote}
      </p>

      <form action="/customers" className="support-lookup-filters" method="get">
        <label>
          <span>{messages.customerSearchLabel}</span>
          <input
            autoComplete="off"
            defaultValue={query}
            maxLength={80}
            name="q"
            placeholder={messages.customerSearchPlaceholder}
            type="search"
          />
        </label>
        <p className="support-filter-help">{messages.customerSearchHelp}</p>
      </form>

      {!hasQuery ? (
        <section className="support-lookup-state is-empty">
          <h2>{messages.customerSearchPromptTitle}</h2>
          <p>{messages.customerSearchPromptDescription}</p>
        </section>
      ) : parsed?.valid === false ? (
        <section className="support-lookup-state is-error" role="alert">
          <h2>{messages.customerSearchInvalid}</h2>
        </section>
      ) : result?.status === "denied" ? (
        <section className="support-lookup-state is-denied" role="alert">
          <h2>{messages.accessDeniedTitle}</h2>
          <p>{messages.accessDeniedDescription}</p>
        </section>
      ) : result?.status === "error" ? (
        <section className="support-lookup-state is-error" role="alert">
          <h2>{messages.customerSearchErrorTitle}</h2>
          <p>{messages.customerSearchErrorDescription}</p>
          <Link href={customerPageUrl(query, 1)}>{messages.retry}</Link>
        </section>
      ) : result?.status === "success" && result.items.length === 0 ? (
        <section className="support-lookup-state is-empty">
          <h2>{messages.customerNoResultsTitle}</h2>
          <p>{messages.customerNoResultsDescription}</p>
        </section>
      ) : result?.status === "success" ? (
        <>
          <div className="support-lookup-results">
            {result.items.map((customer) => (
              <article className="support-lookup-item" key={customer.id}>
                <div className="support-lookup-item-content">
                  <h2>{customer.displayName || messages.informationMissing}</h2>
                  <dl className="support-lookup-facts">
                    <div>
                      <dt>{messages.customerListEmail}</dt>
                      <dd dir="auto">
                        {customer.email || messages.informationMissing}
                      </dd>
                    </div>
                    <div>
                      <dt>{messages.customerListPhone}</dt>
                      <dd dir="ltr">
                        {customer.phone || messages.informationMissing}
                      </dd>
                    </div>
                    <div>
                      <dt>{messages.registeredAtLabel}</dt>
                      <dd dir="auto">
                        {formatAdminDate(customer.registeredAt, locale)}
                      </dd>
                    </div>
                  </dl>
                </div>
                <Link
                  className="support-open-link"
                  href={`/customers/${encodeURIComponent(customer.id)}`}
                >
                  {messages.openCustomer}
                  <span aria-hidden="true" className="support-directional-mark">
                    →
                  </span>
                </Link>
              </article>
            ))}
          </div>
          {(result.page > 1 || result.hasNextPage) && (
            <nav
              aria-label={messages.paginationLabel}
              className="professional-pagination"
            >
              {result.page > 1 ? (
                <Link href={customerPageUrl(query, result.page - 1)} rel="prev">
                  {messages.previousPage}
                </Link>
              ) : (
                <span aria-disabled="true">{messages.previousPage}</span>
              )}
              <span>
                {messages.pageLabel} {result.page}
              </span>
              {result.hasNextPage ? (
                <Link href={customerPageUrl(query, result.page + 1)} rel="next">
                  {messages.nextPage}
                </Link>
              ) : (
                <span aria-disabled="true">{messages.nextPage}</span>
              )}
            </nav>
          )}
        </>
      ) : null}
    </main>
  );
}
