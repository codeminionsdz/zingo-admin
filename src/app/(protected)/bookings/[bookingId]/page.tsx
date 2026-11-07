import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-page-header";
import { getAdminMessages } from "@/i18n/messages";
import { getAdminLocale } from "@/lib/admin-locale";
import {
  formatAdminDate,
  BOOKING_STATUSES,
  formatAdminDateTime,
  formatBookingTimeRange,
} from "@/lib/support-lookup-input";
import { readBookingDetail } from "@/lib/support-lookups";

export const dynamic = "force-dynamic";

function statusLabel(
  status: string,
  messages: ReturnType<typeof getAdminMessages>,
) {
  if (BOOKING_STATUSES.some((item) => item === status)) {
    return messages[`bookingStatus_${status}` as keyof typeof messages];
  }
  return status;
}

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

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const [{ bookingId }, locale] = await Promise.all([params, getAdminLocale()]);
  const messages = getAdminMessages(locale);
  const result = await readBookingDetail(bookingId);

  if (result.status !== "success") {
    const denied = result.status === "denied";
    const notFound = result.status === "not_found";
    return (
      <main className="shell support-detail-page">
        <Link className="support-back-link" href="/bookings">
          {messages.backToBookings}
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
                ? messages.bookingNotFoundTitle
                : messages.bookingDetailErrorTitle}
          </h1>
          <p>
            {denied
              ? messages.accessDeniedDescription
              : notFound
                ? messages.bookingNotFoundDescription
                : messages.bookingDetailErrorDescription}
          </p>
        </section>
      </main>
    );
  }

  const booking = result.booking;
  const localizedServices = booking.services.map((service) => ({
    ...service,
    price: new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-DZ").format(
      service.priceDzd,
    ),
    duration:
      service.durationMinutes === null
        ? messages.bookingDurationUnavailable
        : `${new Intl.NumberFormat(locale === "ar" ? "ar-DZ" : "fr-DZ").format(
            service.durationMinutes,
          )} ${messages.minutesUnit}`,
  }));
  const slotDate = booking.publishedSlot
    ? formatAdminDate(`${booking.publishedSlot.date}T12:00:00Z`, locale)
    : null;
  const slotTime = booking.publishedSlot?.localStartTime.slice(0, 5) ?? null;

  return (
    <main className="shell support-detail-page">
      <Link className="support-back-link" href="/bookings">
        {messages.backToBookings}
      </Link>
      <AdminPageHeader
        eyebrow={messages.bookingDetailEyebrow}
        subtitle={booking.establishmentName || messages.informationMissing}
        title={messages.bookingDetailTitle}
      />
      <p className="support-read-only-note" role="note">
        {messages.supportReadOnlyNote}
      </p>

      <section
        aria-labelledby="booking-summary-title"
        className="support-detail-section"
      >
        <h2 id="booking-summary-title">{messages.bookingSummaryTitle}</h2>
        <div className="booking-detail-id-row">
          <span>{messages.bookingListId}</span>
          <code dir="ltr">{booking.id}</code>
          <span className={`support-status is-${booking.status}`}>
            {statusLabel(booking.status, messages)}
          </span>
        </div>
        <dl className="support-detail-fields">
          <Field
            label={messages.bookingCustomer}
            missing={messages.informationMissing}
            value={booking.customerName}
          />
          <Field
            direction="auto"
            label={messages.customerEmailLabel}
            missing={messages.informationMissing}
            value={booking.customerEmail}
          />
          <Field
            direction="ltr"
            label={messages.customerPhoneLabel}
            missing={messages.informationMissing}
            value={booking.customerPhone}
          />
          <Field
            label={messages.bookingProfessional}
            missing={messages.informationMissing}
            value={booking.professionalName}
          />
          <Field
            label={messages.bookingEstablishment}
            missing={messages.informationMissing}
            value={booking.establishmentName}
          />
          <Field
            direction="auto"
            label={messages.bookingAppointment}
            missing={messages.informationMissing}
            value={formatBookingTimeRange(
              booking.startAt,
              booking.endAt,
              locale,
            )}
          />
          <Field
            direction="auto"
            label={messages.bookingTotal}
            missing={messages.informationMissing}
            value={`${new Intl.NumberFormat(
              locale === "ar" ? "ar-DZ" : "fr-DZ",
            ).format(booking.totalDzd)} DZD`}
          />
          <Field
            direction="auto"
            label={messages.bookingCreatedAt}
            missing={messages.informationMissing}
            value={formatAdminDateTime(booking.createdAt, locale)}
          />
          <Field
            direction="auto"
            label={messages.bookingUpdatedAt}
            missing={messages.informationMissing}
            value={formatAdminDateTime(booking.updatedAt, locale)}
          />
          {booking.decidedAt && (
            <Field
              direction="auto"
              label={messages.bookingDecidedAt}
              missing={messages.informationMissing}
              value={formatAdminDateTime(booking.decidedAt, locale)}
            />
          )}
          {booking.cancelledAt && (
            <Field
              direction="auto"
              label={messages.bookingCancelledAt}
              missing={messages.informationMissing}
              value={formatAdminDateTime(booking.cancelledAt, locale)}
            />
          )}
          {booking.cancellationReason && (
            <Field
              label={messages.bookingCancellationReason}
              missing={messages.informationMissing}
              value={booking.cancellationReason}
            />
          )}
        </dl>
        <p className="support-detail-note">
          {messages.bookingSnapshotAmountHelp}
        </p>
        <p className="support-detail-note">{messages.bookingCustomerContact}</p>
        <p className="support-detail-note">
          {messages.bookingProfessionalNameCurrent}
        </p>
      </section>

      <section
        aria-labelledby="booking-services-title"
        className="support-detail-section"
      >
        <h2 id="booking-services-title">
          {messages.bookingServiceSnapshotsTitle}
        </h2>
        {localizedServices.length === 0 ? (
          <p className="support-detail-note">
            {messages.bookingNoServicesSnapshot}
          </p>
        ) : (
          <div className="support-snapshot-list">
            {localizedServices.map((service) => (
              <article
                className="support-snapshot-item"
                key={`${service.order}-${service.name}`}
              >
                <h3>{service.name}</h3>
                <dl className="support-lookup-facts">
                  <div>
                    <dt>{messages.bookingSavedPrice}</dt>
                    <dd dir="auto">{service.price} DZD</dd>
                  </div>
                  <div>
                    <dt>{messages.bookingSavedDuration}</dt>
                    <dd>{service.duration}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section
        aria-labelledby="booking-slot-title"
        className="support-detail-section"
      >
        <h2 id="booking-slot-title">{messages.bookingPublishedSlotTitle}</h2>
        {booking.publishedSlot ? (
          <p className="booking-slot-value" dir="auto">
            {slotDate} · {slotTime}
          </p>
        ) : (
          <p className="support-detail-note">
            {messages.bookingPublishedSlotUnavailable}
          </p>
        )}
      </section>

      <section
        aria-labelledby="booking-events-title"
        className="support-detail-section"
      >
        <h2 id="booking-events-title">{messages.bookingEventsTitle}</h2>
        {booking.events.length === 0 ? (
          <p className="support-detail-note">{messages.bookingEventsEmpty}</p>
        ) : (
          <ol className="booking-event-list">
            {booking.events.map((event, index) => {
              const eventTypeKey =
                `bookingEventType_${event.eventType}` as keyof typeof messages;
              const eventTypeLabel = messages[eventTypeKey] ?? event.eventType;
              return (
                <li
                  className="booking-event-item"
                  key={`${event.createdAt}-${index}`}
                >
                  <div className="booking-event-marker" aria-hidden="true" />
                  <div className="booking-event-content">
                    <h3>{eventTypeLabel}</h3>
                    {event.fromStatus && (
                      <p>
                        {statusLabel(event.fromStatus, messages)} →{" "}
                        {statusLabel(event.toStatus, messages)}
                      </p>
                    )}
                    <p dir="auto">
                      {formatAdminDateTime(event.createdAt, locale)}
                    </p>
                    <p>
                      {messages.bookingEventActor}:{" "}
                      {event.actorName || messages.bookingEventActorUnavailable}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </main>
  );
}
