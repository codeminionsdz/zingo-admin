"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getAdminMessages } from "@/i18n/messages";
import { algerianWilayas, getWilaya } from "@/lib/shared/algerian-areas";
import {
  countCommunicationRecipients,
  searchCommunicationRecipients,
  sendCommunication,
} from "./actions";

type Messages = ReturnType<typeof getAdminMessages>;
type Audience = "professional" | "customer";
type Recipient = {
  user_id: string;
  display_name: string;
  email: string | null;
  recipient_status: string;
  wilaya_code: number | null;
};

export function CommunicationComposer({
  locale,
  messages,
}: {
  locale: "fr" | "ar";
  messages: Messages;
}) {
  const router = useRouter();
  const [audience, setAudience] = useState<Audience>("professional");
  const [mode, setMode] = useState<"all" | "selected">("all");
  const [status, setStatus] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selected, setSelected] = useState<Record<string, Recipient>>({});
  const [count, setCount] = useState(0);
  const [messageType, setMessageType] = useState<
    "operational" | "announcement"
  >("operational");
  const [language, setLanguage] = useState<"ar" | "fr">(locale);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [destination, setDestination] = useState("");
  const [requestKey] = useState(() => crypto.randomUUID());
  const [error, setError] = useState("");
  const [recipientError, setRecipientError] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [busy, startTransition] = useTransition();
  const recipientRequest = useRef(0);
  const countRequest = useRef(0);
  const filter = useMemo(
    () => ({
      audience,
      status: status || null,
      wilaya: wilaya ? Number(wilaya) : null,
    }),
    [audience, status, wilaya],
  );
  const selectedIds = useMemo(() => Object.keys(selected), [selected]);
  const statuses =
    audience === "professional"
      ? [
          ["draft", messages.communicationsStatusDraft],
          ["submitted", messages.communicationsStatusSubmitted],
          ["approved", messages.communicationsStatusApproved],
          ["rejected", messages.communicationsStatusRejected],
        ]
      : [
          ["active", messages.communicationsStatusActive],
          ["disabled", messages.communicationsStatusDisabled],
        ];

  useEffect(() => {
    const requestId = ++recipientRequest.current;
    const timer = setTimeout(() => {
      setLoadingRecipients(true);
      void searchCommunicationRecipients({
        ...filter,
        query: query.trim(),
        page,
      }).then((result) => {
        if (requestId !== recipientRequest.current) return;
        setRecipientError(result.failed);
        setRecipients((current) =>
          page === 1 ? result.recipients : [...current, ...result.recipients],
        );
        setLoadingRecipients(false);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [filter, query, page]);

  useEffect(() => {
    const requestId = ++countRequest.current;
    void countCommunicationRecipients({
      ...filter,
      userIds: mode === "selected" ? selectedIds : null,
    }).then((result) => {
      if (requestId !== countRequest.current) return;
      setCount(result.count);
      setError(result.failed ? messages.communicationsCountError : "");
    });
  }, [filter, mode, selectedIds, messages.communicationsCountError]);

  function changeFilter(change: () => void) {
    change();
    setSelected({});
    setPage(1);
    setRecipients([]);
  }

  function toggleRecipient(recipient: Recipient) {
    setSelected((current) => {
      const next = { ...current };
      if (next[recipient.user_id]) delete next[recipient.user_id];
      else next[recipient.user_id] = recipient;
      return next;
    });
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!count || busy) return;
    if (count > 1) {
      const audienceLabel =
        audience === "professional"
          ? messages.communicationsProfessionals
          : messages.communicationsCustomers;
      const prompt = messages.communicationsConfirmPrompt
        .replace("{count}", String(count))
        .replace("{audience}", audienceLabel);
      if (!window.confirm(prompt)) return;
    }
    startTransition(async () => {
      const result = await sendCommunication({
        requestKey,
        messageType,
        audience,
        mode,
        status: status || null,
        wilaya: wilaya ? Number(wilaya) : null,
        userIds: selectedIds,
        expectedCount: count,
        language,
        title,
        body,
        destination: destination || null,
      });
      if (result.error || !result.messageId) {
        if (result.stalePreview) {
          const refreshed = await countCommunicationRecipients({
            ...filter,
            userIds: mode === "selected" ? selectedIds : null,
          });
          if (!refreshed.failed) setCount(refreshed.count);
          setError(messages.communicationsPreviewChanged);
        } else {
          setError(messages.communicationsSendError);
        }
        return;
      }
      router.push(`/communications/${result.messageId}`);
      router.refresh();
    });
  }

  const audienceLabel =
    audience === "professional"
      ? messages.communicationsProfessionals
      : messages.communicationsCustomers;
  const showRecipients = mode === "selected";

  return (
    <form className="communication-composer" onSubmit={submit}>
      <div className="communication-form-grid">
        <label>
          {messages.communicationsAudience}
          <select
            value={audience}
            onChange={(event) => {
              changeFilter(() => setAudience(event.target.value as Audience));
              setStatus("");
            }}
          >
            <option value="professional">
              {messages.communicationsProfessionals}
            </option>
            <option value="customer">{messages.communicationsCustomers}</option>
          </select>
        </label>
        <label>
          {messages.communicationsRecipientMode}
          <select
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as "all" | "selected");
              setSelected({});
            }}
          >
            <option value="all">{messages.communicationsAll}</option>
            <option value="selected">{messages.communicationsSelected}</option>
          </select>
        </label>
        <label>
          {messages.communicationsStatus}
          <select
            value={status}
            onChange={(event) =>
              changeFilter(() => setStatus(event.target.value))
            }
          >
            <option value="">{messages.communicationsAnyStatus}</option>
            {statuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {messages.communicationsWilaya}
          <select
            value={wilaya}
            onChange={(event) =>
              changeFilter(() => setWilaya(event.target.value))
            }
          >
            <option value="">{messages.communicationsAnyWilaya}</option>
            {algerianWilayas.map((item) => (
              <option key={item.code} value={item.code}>
                {String(item.code).padStart(2, "0")} ·{" "}
                {locale === "ar" ? item.nameAr : item.nameFr}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showRecipients ? (
        <section className="communication-recipient-picker">
          <label>
            {messages.communicationsSearch}
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
                setRecipients([]);
              }}
              maxLength={80}
            />
          </label>
          <p className="communication-help">
            {selectedIds.length} {messages.communicationsSelectedCount}
          </p>
          {recipientError ? (
            <p role="alert">{messages.communicationsSendError}</p>
          ) : null}
          {recipients.length ? (
            <ul className="communication-recipient-list">
              {recipients.map((recipient) => (
                <li key={recipient.user_id}>
                  <label className="communication-recipient-option">
                    <input
                      type="checkbox"
                      checked={Boolean(selected[recipient.user_id])}
                      onChange={() => toggleRecipient(recipient)}
                    />
                    <span>{recipient.display_name}</span>
                    <small>
                      {recipient.email ? `${recipient.email} · ` : ""}
                      {recipient.recipient_status}
                      {recipient.wilaya_code
                        ? ` · ${String(recipient.wilaya_code).padStart(2, "0")} ${locale === "ar" ? (getWilaya(recipient.wilaya_code)?.nameAr ?? "") : (getWilaya(recipient.wilaya_code)?.nameFr ?? "")}`
                        : ""}
                    </small>
                  </label>
                </li>
              ))}
            </ul>
          ) : loadingRecipients ? (
            <p>{messages.communicationsLoadingRecipients}</p>
          ) : (
            <p>{messages.communicationsNoRecipients}</p>
          )}
          {recipients.length >= page * 25 ? (
            <button
              className="button button-secondary"
              type="button"
              disabled={loadingRecipients}
              onClick={() => setPage((value) => value + 1)}
            >
              {messages.communicationsLoadMore}
            </button>
          ) : null}
        </section>
      ) : null}

      <p className="communication-count">
        <strong>{count}</strong> {messages.communicationsRecipientCount} ·{" "}
        {audienceLabel}
      </p>

      <div className="communication-form-grid">
        <label>
          {messages.communicationsType}
          <select
            value={messageType}
            onChange={(event) =>
              setMessageType(
                event.target.value as "operational" | "announcement",
              )
            }
          >
            <option value="operational">
              {messages.communicationsOperational}
            </option>
            <option value="announcement">
              {messages.communicationsAnnouncement}
            </option>
          </select>
        </label>
        <label>
          {messages.communicationsLanguage}
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as "ar" | "fr")}
          >
            <option value="ar">{messages.communicationsArabic}</option>
            <option value="fr">{messages.communicationsFrench}</option>
          </select>
        </label>
        <label>
          {messages.communicationsDestination}
          <select
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
          >
            <option value="">{messages.communicationsNoDestination}</option>
            <option value="home">{messages.communicationsHome}</option>
            <option value="bookings">{messages.communicationsBookings}</option>
            <option value="profile">{messages.communicationsProfile}</option>
            <option value="notifications">
              {messages.communicationsInbox}
            </option>
          </select>
        </label>
      </div>

      <div className="communication-form-grid">
        <label>
          {messages.communicationsTitleLabel}
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            dir="auto"
          />
        </label>
        <label className="communication-body-field">
          {messages.communicationsBodyLabel}
          <textarea
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            rows={5}
            dir="auto"
          />
        </label>
      </div>

      <section className="communication-preview" aria-live="polite">
        <span className="communication-eyebrow">
          {messages.communicationsPreview}
        </span>
        <h2 dir="auto">{title || messages.communicationsTitleLabel}</h2>
        <p dir="auto">{body || messages.communicationsBodyLabel}</p>
      </section>
      {error ? (
        <p className="communication-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="button button-primary communication-submit"
        type="submit"
        disabled={busy || count === 0}
      >
        {busy ? messages.communicationsConfirm : messages.communicationsSend} ·{" "}
        {count}
      </button>
    </form>
  );
}
