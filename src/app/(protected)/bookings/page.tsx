import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { getAdminMessages } from "@/i18n/messages";
import { getAdminLocale } from "@/lib/admin-locale";
import {
  BOOKING_STATUSES,
  formatBookingTimeRange,
  parseBookingSearchInput,
} from "@/lib/support-lookup-input";
import { readBookingSearch } from "@/lib/support-lookups";

export const dynamic = "force-dynamic";

function bookingPageUrl(input: {
  query: string;
  status: string;
  from: string;
  until: string;
  page: number;
}) {
  const params = new URLSearchParams();
  if (input.query) params.set("q", input.query);
  if (input.status !== "all") params.set("status", input.status);
  if (input.from) params.set("from", input.from);
  if (input.until) params.set("until", input.until);
  params.set("page", String(input.page));
  return `/bookings?${params.toString()}`;
}

function statusLabel(
  status: string,
  messages: ReturnType<typeof getAdminMessages>,
) {
  if (BOOKING_STATUSES.some((item) => item === status)) {
    return messages[`bookingStatus_${status}` as keyof typeof messages];
  }
  return status;
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    from?: string;
    until?: string;
    page?: string;
  }>;
}) {
  const [params, locale] = await Promise.all([searchParams, getAdminLocale()]);
  const messages = getAdminMessages(locale);
  const parsed = parseBookingSearchInput(params);
  const result = parsed.valid ? await readBookingSearch(parsed.value) : null;
  const query = (params.q ?? "").trim();
  const status =
    params.status && BOOKING_STATUSES.some((item) => item === params.status)
      ? params.status
      : "all";
  const from = params.from ?? "";
  const until = params.until ?? "";

  return (
    <main className="shell support-lookup-page">
      <AdminPageHeader
        eyebrow={messages.bookingLookupEyebrow}
        subtitle={messages.bookingLookupSubtitle}
        title={messages.bookingLookupTitle}
      />
      <p className="support-read-only-note" role="note">
        {messages.supportReadOnlyNote}
      </p>

      <form
        action="/bookings"
        className="support-lookup-filters is-booking"
        method="get"
      >
        <label>
          <span>{messages.bookingSearchLabel}</span>
          <input
            autoComplete="off"
            defaultValue={query}
            maxLength={80}
            name="q"
            placeholder={messages.bookingSearchPlaceholder}
            type="search"
          />
        </label>
        <label>
          <span>{messages.bookingStatusLabel}</span>
          <select defaultValue={status} name="status">
            <option value="all">{messages.bookingStatus_all}</option>
            {BOOKING_STATUSES.map((bookingStatus) => (
              <option key={bookingStatus} value={bookingStatus}>
                {messages[`bookingStatus_${bookingStatus}`]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{messages.bookingDateFrom}</span>
          <input defaultValue={from} name="from" type="date" />
        </label>
        <label>
          <span>{messages.bookingDateUntil}</span>
          <input defaultValue={until} name="until" type="date" />
        </label>
        <p className="support-filter-help">{messages.bookingSearchHelp}</p>
      </form>

      {!parsed.valid ? (
        <section
          className={`support-lookup-state ${
            parsed.reason === "criteria" ? "is-empty" : "is-error"
          }`}
          role={parsed.reason === "criteria" ? undefined : "alert"}
        >
          <h2>
            {parsed.reason === "criteria"
              ? messages.bookingSearchPromptTitle
              : messages.bookingSearchInvalid}
          </h2>
          {parsed.reason === "criteria" && (
            <p>{messages.bookingSearchPromptDescription}</p>
          )}
        </section>
      ) : result?.status === "denied" ? (
        <section className="support-lookup-state is-denied" role="alert">
          <h2>{messages.accessDeniedTitle}</h2>
          <p>{messages.accessDeniedDescription}</p>
        </section>
      ) : result?.status === "error" ? (
        <section className="support-lookup-state is-error" role="alert">
          <h2>{messages.bookingSearchErrorTitle}</h2>
          <p>{messages.bookingSearchErrorDescription}</p>
          <Link href={bookingPageUrl({ query, status, from, until, page: 1 })}>
            {messages.retry}
          </Link>
        </section>
      ) : result?.status === "success" && result.items.length === 0 ? (
        <section className="support-lookup-state is-empty">
          <h2>{messages.bookingNoResultsTitle}</h2>
          <p>{messages.bookingNoResultsDescription}</p>
        </section>
      ) : result?.status === "success" ? (
        <>
          <div className="support-lookup-results">
            {result.items.map((booking) => (
              <article
                className="support-lookup-item booking-lookup-item"
                key={booking.id}
              >
                <div className="support-lookup-item-content">
                  <div className="booking-lookup-heading">
                    <h2 dir="ltr">{booking.id}</h2>
                    <span className={`support-status is-${booking.status}`}>
                      {statusLabel(booking.status, messages)}
                    </span>
                  </div>
                  <dl className="support-lookup-facts booking-lookup-facts">
                    <div>
                      <dt>{messages.bookingCustomer}</dt>
                      <dd>
                        {booking.customerName || messages.informationMissing}
                      </dd>
                    </div>
                    <div>
                      <dt>{messages.bookingProfessional}</dt>
                      <dd>
                        {booking.professionalName ||
                          messages.informationMissing}
                      </dd>
                    </div>
                    <div>
                      <dt>{messages.bookingEstablishment}</dt>
                      <dd>
                        {booking.establishmentName ||
                          messages.informationMissing}
                      </dd>
                    </div>
                    <div>
                      <dt>{messages.bookingAppointment}</dt>
                      <dd dir="auto">
                        {formatBookingTimeRange(
                          booking.startAt,
                          booking.endAt,
                          locale,
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>{messages.bookingServices}</dt>
                      <dd>
                        {booking.serviceNames.join(" · ") ||
                          messages.bookingNoServicesSnapshot}
                      </dd>
                    </div>
                    <div>
                      <dt>{messages.bookingTotal}</dt>
                      <dd dir="auto">
                        {new Intl.NumberFormat(
                          locale === "ar" ? "ar-DZ" : "fr-DZ",
                        ).format(booking.totalDzd)}{" "}
                        DZD
                      </dd>
                    </div>
                  </dl>
                </div>
                <Link
                  className="support-open-link"
                  href={`/bookings/${encodeURIComponent(booking.id)}`}
                >
                  {messages.openBooking}
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
                <Link
                  href={bookingPageUrl({
                    query,
                    status,
                    from,
                    until,
                    page: result.page - 1,
                  })}
                  rel="prev"
                >
                  {messages.previousPage}
                </Link>
              ) : (
                <span aria-disabled="true">{messages.previousPage}</span>
              )}
              <span>
                {messages.pageLabel} {result.page}
              </span>
              {result.hasNextPage ? (
                <Link
                  href={bookingPageUrl({
                    query,
                    status,
                    from,
                    until,
                    page: result.page + 1,
                  })}
                  rel="next"
                >
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
