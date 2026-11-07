import Link from "next/link";
import { getCommune, getWilaya } from "@/lib/shared/algerian-areas";
import { AdminPageHeader } from "@/components/admin-page-header";
import { getAdminMessages } from "@/i18n/messages";
import { getAdminLocale } from "@/lib/admin-locale";
import {
  formatAdminDate,
  formatAdminDateTime,
} from "@/lib/support-lookup-input";
import { readCustomerDetail } from "@/lib/support-lookups";

export const dynamic = "force-dynamic";

function Field({
  label,
  value,
  direction,
  missing,
}: {
  label: string;
  value: string | null;
  direction?: "auto" | "ltr";
  missing: string;
}) {
  return (
    <div className="support-detail-field">
      <dt>{label}</dt>
      <dd dir={direction}>
        {value || <span className="is-missing">{missing}</span>}
      </dd>
    </div>
  );
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const [{ customerId }, locale] = await Promise.all([
    params,
    getAdminLocale(),
  ]);
  const messages = getAdminMessages(locale);
  const result = await readCustomerDetail(customerId);

  if (result.status !== "success") {
    const denied = result.status === "denied";
    const notFound = result.status === "not_found";
    return (
      <main className="shell support-detail-page">
        <Link className="support-back-link" href="/customers">
          {messages.backToCustomers}
        </Link>
        <section
          className={`support-lookup-state ${
            denied ? "is-denied" : notFound ? "is-empty" : "is-error"
          }`}
          role={denied || !notFound ? "alert" : undefined}
        >
          <h1>
            {denied
              ? messages.accessDeniedTitle
              : notFound
                ? messages.customerNotFoundTitle
                : messages.customerDetailErrorTitle}
          </h1>
          <p>
            {denied
              ? messages.accessDeniedDescription
              : notFound
                ? messages.customerNotFoundDescription
                : messages.customerDetailErrorDescription}
          </p>
        </section>
      </main>
    );
  }

  const customer = result.customer;
  const wilaya = getWilaya(customer.wilayaCode);
  const commune = getCommune(customer.wilayaCode, customer.communeCode);
  const displayedWilaya =
    wilaya?.[locale === "ar" ? "nameAr" : "nameFr"] ?? null;
  const displayedCommune =
    commune?.[locale === "ar" ? "nameAr" : "nameFr"] ?? null;

  return (
    <main className="shell support-detail-page">
      <Link className="support-back-link" href="/customers">
        {messages.backToCustomers}
      </Link>
      <AdminPageHeader
        eyebrow={messages.customerDetailEyebrow}
        subtitle={customer.email || messages.informationMissing}
        title={customer.displayName || messages.customerDetailTitle}
      />
      <p className="support-read-only-note" role="note">
        {messages.supportReadOnlyNote}
      </p>

      <section
        aria-labelledby="customer-identity-title"
        className="support-detail-section"
      >
        <h2 id="customer-identity-title">{messages.customerSectionTitle}</h2>
        <dl className="support-detail-fields">
          <Field
            direction="auto"
            label={messages.customerEmailLabel}
            missing={messages.informationMissing}
            value={customer.email}
          />
          <Field
            direction="ltr"
            label={messages.customerPhoneLabel}
            missing={messages.informationMissing}
            value={customer.phone}
          />
          <Field
            direction="auto"
            label={messages.customerRegistrationLabel}
            missing={messages.informationMissing}
            value={formatAdminDate(customer.registeredAt, locale)}
          />
        </dl>
        <p
          className="support-detail-note"
          aria-label={messages.customerAccountStatusLabel}
        >
          {messages.customerAccountStatusUnavailable}
        </p>
      </section>

      <section
        aria-labelledby="customer-residence-title"
        className="support-detail-section"
      >
        <h2 id="customer-residence-title">{messages.customerResidenceTitle}</h2>
        {displayedWilaya || displayedCommune ? (
          <dl className="support-detail-fields">
            <Field
              label={messages.wilayaLabel}
              missing={messages.informationMissing}
              value={displayedWilaya}
            />
            <Field
              label={messages.communeLabel}
              missing={messages.informationMissing}
              value={displayedCommune}
            />
          </dl>
        ) : (
          <p className="support-detail-note">
            {messages.customerResidenceUnavailable}
          </p>
        )}
      </section>

      <section
        aria-labelledby="customer-bookings-title"
        className="support-detail-section"
      >
        <h2 id="customer-bookings-title">{messages.customerBookingsTitle}</h2>
        {customer.bookings.length === 0 ? (
          <p className="support-detail-note">
            {messages.customerBookingsEmpty}
          </p>
        ) : (
          <div className="support-booking-history">
            {customer.bookings.map((booking) => (
              <article
                className="support-booking-history-item"
                key={booking.id}
              >
                <div>
                  <p dir="auto">
                    {formatAdminDateTime(booking.startAt, locale)}
                  </p>
                  <span
                    className={`support-status is-${booking.status}`}
                    role="status"
                  >
                    {messages[
                      `bookingStatus_${booking.status}` as keyof typeof messages
                    ] ?? booking.status}
                  </span>
                  <p className="support-booking-services">
                    {booking.services
                      .map((service) => service.name)
                      .join(" · ") || messages.bookingNoServicesSnapshot}
                  </p>
                  <p className="support-booking-amount" dir="auto">
                    {new Intl.NumberFormat(
                      locale === "ar" ? "ar-DZ" : "fr-DZ",
                    ).format(booking.totalDzd)}{" "}
                    DZD
                  </p>
                </div>
                <Link
                  className="support-open-link"
                  href={`/bookings/${booking.id}`}
                >
                  {messages.openBooking}
                  <span aria-hidden="true" className="support-directional-mark">
                    →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
        {customer.hasMoreBookings && (
          <p className="support-detail-note">
            {messages.customerBookingsTruncated}
          </p>
        )}
      </section>

      <p className="support-detail-note">
        {messages.customerActivityUnavailable}
      </p>
    </main>
  );
}
