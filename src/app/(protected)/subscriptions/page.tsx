import Link from "next/link";
import { getAdminLocale } from "@/lib/admin-locale";
import { assertAdminPrincipal } from "@/lib/auth/assert-admin";
import { resolveAdminPrincipal } from "@/lib/auth/resolve-admin-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { IssueCodeForm } from "./issue-code-form";
import {
  reviewManualPaymentProof,
  revokeActivationCode,
  setSubscriptionSuspension,
  setSubscriptionPeriod,
  confirmCashPayment,
} from "./actions";
import {
  formatSubscriptionDate,
  formatSubscriptionDateTime,
  SubscriptionDataError,
  SubscriptionEmptyState,
  SubscriptionMetric,
  SubscriptionWorkspace,
  subscriptionCopy,
  subscriptionQueryError,
  type SubscriptionSection,
} from "./workspace-ui";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  section?: string;
  status?: string;
  q?: string;
  error?: string;
  updated?: string;
}>;

const isSection = (value: string | undefined): value is SubscriptionSection =>
  ["overview", "plans", "subscriptions", "codes", "proofs"].includes(
    value ?? "",
  );

function localDateInput(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Algiers",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (name: string) =>
    parts.find((item) => item.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function statusLabel(status: string, locale: "fr" | "ar") {
  const labels: Record<string, [string, string]> = {
    awaiting_cash_confirmation: [
      "Espèces à confirmer",
      "بانتظار تأكيد الدفع نقدًا",
    ],
    active: ["Actif", "نشط"],
    scheduled: ["Programmé", "مجدول"],
    awaiting_payment: ["En attente de paiement", "بانتظار الدفع"],
    pending_review: ["Paiement à examiner", "إثبات بانتظار المراجعة"],
    expired: ["Expiré", "منتهي"],
    suspended: ["Suspendu", "معلّق"],
    cancelled: ["Annulé", "ملغى"],
    rejected: ["Refusé", "مرفوض"],
    revoked: ["Révoqué", "ملغى"],
    exhausted: ["Épuisé", "مستنفد"],
    pending: ["En attente", "قيد الانتظار"],
    approved: ["Approuvé", "مقبول"],
  };
  return labels[status]?.[locale === "ar" ? 1 : 0] ?? status;
}

function isPendingSubscription(status: string) {
  return status === "awaiting_payment" || status === "pending_review";
}

function getSubscriptionFilter(
  status: string,
  subscription: { effective_status: string },
) {
  if (status === "active") return subscription.effective_status === "active";
  if (status === "pending")
    return isPendingSubscription(subscription.effective_status);
  if (status === "expired") return subscription.effective_status === "expired";
  if (status === "closed") {
    return ["cancelled", "rejected", "suspended", "revoked"].includes(
      subscription.effective_status,
    );
  }
  return true;
}

function SubscriptionStatusBadge({
  status,
  locale,
}: {
  status: string;
  locale: "fr" | "ar";
}) {
  return (
    <span className={`subscription-status status-${status}`}>
      <span aria-hidden="true" />
      {statusLabel(status, locale)}
    </span>
  );
}

function QueryNotice({
  locale,
  error,
  updated,
}: {
  locale: "fr" | "ar";
  error?: string;
  updated?: string;
}) {
  const errors: Record<string, [string, string]> = {
    invalid_review: [
      "Vérifiez la décision et le motif de refus.",
      "تحقق من القرار وسبب الرفض.",
    ],
    review_failed: [
      "La preuve n’a pas pu être traitée.",
      "تعذرت معالجة إثبات الدفع.",
    ],
    incomplete_professional_profile_missing: [
      "Le profil professionnel est introuvable.",
      "تعذر العثور على الملف المهني.",
    ],
    incomplete_establishment_missing: [
      "L’établissement doit être créé avant l’activation.",
      "يجب إنشاء المؤسسة قبل التفعيل.",
    ],
    incomplete_display_name_required: [
      "Le nom professionnel est requis avant l’activation.",
      "الاسم المهني مطلوب قبل التفعيل.",
    ],
    incomplete_contact_phone_required: [
      "Le téléphone de contact est requis avant l’activation.",
      "هاتف الاتصال مطلوب قبل التفعيل.",
    ],
    incomplete_establishment_name_required: [
      "Le nom de l’établissement est requis avant l’activation.",
      "اسم المؤسسة مطلوب قبل التفعيل.",
    ],
    incomplete_address_required: [
      "L’adresse de l’établissement est requise avant l’activation.",
      "عنوان المؤسسة مطلوب قبل التفعيل.",
    ],
    incomplete_wilaya_required: [
      "La wilaya de l’établissement est requise avant l’activation.",
      "الولاية مطلوبة قبل التفعيل.",
    ],
    incomplete_commune_required: [
      "La commune de l’établissement est requise avant l’activation.",
      "البلدية مطلوبة قبل التفعيل.",
    ],
    incomplete_audience_required: [
      "Le public de l’établissement est requis avant l’activation.",
      "تصنيف جمهور المؤسسة مطلوب قبل التفعيل.",
    ],
    invalid_code: [
      "Le code sélectionné n’est pas valide.",
      "الرمز المحدد غير صالح.",
    ],
    revoke_failed: ["Le code n’a pas pu être révoqué.", "تعذر إلغاء الرمز."],
    invalid_suspension: ["Vérifiez le motif saisi.", "تحقق من السبب المدخل."],
    suspension_failed: [
      "Le statut de l’abonnement n’a pas pu être modifié.",
      "تعذر تغيير حالة الاشتراك.",
    ],
    invalid_period: [
      "Vérifiez les dates et le motif saisis.",
      "تحقق من التواريخ والسبب المدخل.",
    ],
    period_failed: [
      "La période de l’abonnement n’a pas pu être modifiée.",
      "تعذر تعديل فترة الاشتراك.",
    ],
  };
  const updates: Record<string, [string, string]> = {
    reviewed: ["La décision a été enregistrée.", "تم تسجيل القرار."],
    activation: [
      "Paiement approuvé : abonnement activé, professionnel approuvé et établissement publié.",
      "تمت الموافقة على الدفع: فُعّل الاشتراك وأُقرّ المهني ونُشرت المؤسسة.",
    ],
    revoked: ["Le code a été révoqué.", "تم إلغاء الرمز."],
    subscription: [
      "Le statut de l’abonnement a été mis à jour.",
      "تم تحديث حالة الاشتراك.",
    ],
    period: [
      "La période de l’abonnement a été mise à jour.",
      "تم تحديث فترة الاشتراك.",
    ],
  };
  return (
    <>
      {error ? (
        <p className="subscription-flash is-error" role="alert">
          {errors[error]?.[locale === "ar" ? 1 : 0] ??
            (locale === "ar"
              ? "تعذر إكمال العملية."
              : "L’opération n’a pas abouti.")}
        </p>
      ) : null}
      {updated ? (
        <p className="subscription-flash is-success" role="status">
          {updates[updated]?.[locale === "ar" ? 1 : 0] ??
            (locale === "ar"
              ? "تم حفظ التغيير."
              : "La modification a été enregistrée.")}
        </p>
      ) : null}
    </>
  );
}

export default async function SubscriptionOperationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const principal = await resolveAdminPrincipal();
  assertAdminPrincipal(principal);
  const [params, locale] = await Promise.all([searchParams, getAdminLocale()]);
  const section = isSection(params.section) ? params.section : "overview";
  const copy = subscriptionCopy(locale);
  const ar = locale === "ar";
  const supabase = await createSupabaseServerClient();

  if (section === "overview") {
    const [
      subscriptionResult,
      planResult,
      codeResult,
      proofResult,
      auditResult,
    ] = await Promise.all([
      supabase.rpc("admin_list_subscriptions"),
      supabase.rpc("admin_list_subscription_plans_v2"),
      supabase.rpc("admin_list_activation_codes"),
      supabase.rpc("admin_list_subscription_payment_proofs"),
      supabase.rpc("admin_list_subscription_audit"),
    ]);
    // Code validity is evaluated against one request-time reference.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const subscriptions = subscriptionResult.data;
    const plans = planResult.data?.filter(
      (plan) => plan.plan_key !== "v1-unconfigured",
    );
    const codes = codeResult.data;
    const activeCount = subscriptions?.filter(
      (item) => item.effective_status === "active",
    ).length;
    const pendingCount = subscriptions?.filter((item) =>
      isPendingSubscription(item.effective_status),
    ).length;
    const availableCodes = codes?.filter(
      (code) =>
        code.status === "active" &&
        new Date(code.valid_from).getTime() <= now &&
        (!code.valid_until || new Date(code.valid_until).getTime() > now) &&
        code.usage_count < code.usage_limit,
    ).length;
    const expiringCount = subscriptions?.filter((item) => {
      const expiry = item.expires_at
        ? new Date(item.expires_at).getTime()
        : Number.NaN;
      return (
        item.effective_status === "active" &&
        Number.isFinite(expiry) &&
        expiry > now &&
        expiry <= now + 30 * 24 * 60 * 60 * 1000
      );
    }).length;
    const errors = [
      subscriptionResult.error,
      planResult.error,
      codeResult.error,
      proofResult.error,
      auditResult.error,
    ].filter((error): error is NonNullable<typeof error> => Boolean(error));
    const uniqueErrors = Array.from(
      new Map(
        errors.map((error) => [`${error.code}:${error.message}`, error]),
      ).values(),
    );

    return (
      <SubscriptionWorkspace
        locale={locale}
        active="overview"
        title={copy.moduleTitle}
        description={copy.moduleDescription}
        action={
          <Link
            className="button button-primary"
            href="/subscriptions/plans#create-plan"
          >
            {ar ? "إنشاء خطة" : "Créer une formule"}
          </Link>
        }
      >
        <QueryNotice
          locale={locale}
          error={params.error}
          updated={params.updated}
        />
        {uniqueErrors.map((error) => (
          <SubscriptionDataError
            key={`${error.code}:${error.message}`}
            locale={locale}
            error={error}
          />
        ))}
        <section
          className="subscription-metrics"
          aria-label={ar ? "مؤشرات الاشتراك" : "Indicateurs des abonnements"}
        >
          <SubscriptionMetric
            label={ar ? "الاشتراكات النشطة" : "Abonnements actifs"}
            value={subscriptionResult.error ? null : (activeCount ?? 0)}
            detail={
              subscriptionResult.error
                ? copy.databaseUnavailable
                : ar
                  ? "حاليًا"
                  : "En cours"
            }
            tone="green"
          />
          <SubscriptionMetric
            label={ar ? "الخطط المنشورة" : "Formules publiées"}
            value={
              planResult.error
                ? null
                : (plans?.filter((plan) => plan.is_active).length ?? 0)
            }
            detail={
              planResult.error
                ? copy.databaseUnavailable
                : ar
                  ? "متاحة للمهنيين"
                  : "Disponibles aux professionnels"
            }
            tone="coral"
          />
          <SubscriptionMetric
            label={ar ? "طلبات بانتظار الإجراء" : "Demandes à traiter"}
            value={subscriptionResult.error ? null : (pendingCount ?? 0)}
            detail={
              subscriptionResult.error
                ? copy.databaseUnavailable
                : ar
                  ? "طلبات اشتراك بانتظار الدفع أو المراجعة"
                  : "Demandes d’abonnement en attente"
            }
            tone="amber"
          />
          <SubscriptionMetric
            label={ar ? "رموز قابلة للاستخدام" : "Codes utilisables"}
            value={codeResult.error ? null : (availableCodes ?? 0)}
            detail={
              codeResult.error
                ? copy.databaseUnavailable
                : ar
                  ? "صالحة وغير مستهلكة بالكامل"
                  : "Valides et non épuisés"
            }
          />
          <SubscriptionMetric
            label={ar ? "انتهاء خلال 30 يومًا" : "Expirent sous 30 jours"}
            value={subscriptionResult.error ? null : (expiringCount ?? 0)}
            detail={
              subscriptionResult.error
                ? copy.databaseUnavailable
                : ar
                  ? "حسب تاريخ الانتهاء"
                  : "Selon leur date d’expiration"
            }
          />
        </section>
        <div className="subscription-overview-grid">
          <section className="subscription-panel">
            <div className="subscription-panel-heading">
              <div>
                <p className="subscription-eyebrow">
                  {ar ? "التشغيل" : "OPÉRATIONS"}
                </p>
                <h2>{ar ? "مسارات العمل" : "Raccourcis opérationnels"}</h2>
              </div>
            </div>
            <div className="subscription-shortcuts">
              <Link
                href="/subscriptions/plans"
                className="subscription-shortcut"
              >
                <span className="subscription-shortcut-icon" aria-hidden="true">
                  01
                </span>
                <span>
                  <strong>{copy.sections.plans}</strong>
                  <small>
                    {ar
                      ? "إدارة النشر والأسعار والمدة"
                      : "Gérer publication, tarifs et durée"}
                  </small>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/subscriptions?section=subscriptions"
                className="subscription-shortcut"
              >
                <span className="subscription-shortcut-icon" aria-hidden="true">
                  02
                </span>
                <span>
                  <strong>{copy.sections.subscriptions}</strong>
                  <small>
                    {ar
                      ? "عرض الحالة وفترة الاشتراك"
                      : "Consulter les statuts et périodes"}
                  </small>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/subscriptions?section=codes"
                className="subscription-shortcut"
              >
                <span className="subscription-shortcut-icon" aria-hidden="true">
                  03
                </span>
                <span>
                  <strong>{copy.sections.codes}</strong>
                  <small>
                    {ar
                      ? "إصدار الرموز ومتابعة استخدامها"
                      : "Émettre et suivre les codes"}
                  </small>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/subscriptions?section=proofs"
                className="subscription-shortcut"
              >
                <span className="subscription-shortcut-icon" aria-hidden="true">
                  04
                </span>
                <span>
                  <strong>{copy.sections.proofs}</strong>
                  <small>
                    {ar
                      ? "مراجعة إثباتات الدفع المرسلة"
                      : "Examiner les justificatifs reçus"}
                  </small>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>
          <section className="subscription-panel">
            <div className="subscription-panel-heading">
              <div>
                <p className="subscription-eyebrow">
                  {ar ? "سجل التدقيق" : "JOURNAL D’AUDIT"}
                </p>
                <h2>{ar ? "النشاط الأخير" : "Activité récente"}</h2>
              </div>
              <Link href="/operations/audit">
                {ar ? "كل العمليات" : "Tout l’audit"}
              </Link>
            </div>
            {auditResult.error ? (
              <p className="subscription-inline-error">
                {subscriptionQueryError(locale, auditResult.error)}
              </p>
            ) : auditResult.data?.length ? (
              <ol className="subscription-activity-list">
                {auditResult.data.slice(0, 6).map((event) => (
                  <li key={event.id}>
                    <span
                      className="subscription-activity-dot"
                      aria-hidden="true"
                    />
                    <div>
                      <strong>{event.action.replaceAll("_", " ")}</strong>
                      <p>
                        {formatSubscriptionDateTime(event.created_at, locale)}
                        {event.details &&
                        typeof event.details.plan_key === "string"
                          ? ` · ${event.details.plan_key}`
                          : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <SubscriptionEmptyState
                title={ar ? "لا يوجد نشاط مسجل" : "Aucune activité enregistrée"}
                description={
                  ar
                    ? "سيظهر هنا سجل عمليات الاشتراك عند توفره."
                    : "Les opérations d’abonnement apparaîtront ici lorsqu’elles existeront."
                }
              />
            )}
          </section>
        </div>
      </SubscriptionWorkspace>
    );
  }

  if (section === "subscriptions") {
    const [result, auditResult, cashResult] = await Promise.all([
      supabase.rpc("admin_list_subscriptions"),
      supabase.rpc("admin_list_subscription_audit"),
      supabase.rpc("admin_list_cash_payment_requests"),
    ]);
    const all = result.data ?? [];
    const sourceBySubscriptionId = new Map<string, string>();
    for (const event of auditResult.data ?? []) {
      if (
        !event.subscription_id ||
        sourceBySubscriptionId.has(event.subscription_id)
      )
        continue;
      if (event.action === "activation_code_redeemed") {
        sourceBySubscriptionId.set(
          event.subscription_id,
          ar ? "رمز تفعيل" : "Code d’activation",
        );
      } else if (
        event.action === "payment_approved" ||
        event.action === "manual_attempt_created"
      ) {
        sourceBySubscriptionId.set(
          event.subscription_id,
          ar ? "دفع يدوي" : "Paiement manuel",
        );
      }
    }
    const query = params.q?.trim().toLocaleLowerCase(locale) ?? "";
    const filtered = all.filter((item) => {
      const matchesQuery =
        !query ||
        [
          item.professional_name,
          item.establishment_name,
          item.plan_name_snapshot,
          item.plan_key,
          item.professional_user_id,
        ]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase(locale).includes(query));
      return matchesQuery && getSubscriptionFilter(params.status ?? "", item);
    });
    const statusOptions = [
      ["", ar ? "كل الحالات" : "Tous les statuts"],
      ["active", statusLabel("active", locale)],
      ["pending", ar ? "قيد الانتظار" : "En attente"],
      ["expired", statusLabel("expired", locale)],
      [
        "closed",
        ar ? "مغلقة / مرفوضة / معلّقة" : "Clôturés / refusés / suspendus",
      ],
    ];
    return (
      <SubscriptionWorkspace
        locale={locale}
        active="subscriptions"
        title={copy.sections.subscriptions}
        description={
          ar
            ? "ابحث في سجلات الاشتراك وحالاتها وفتراتها."
            : "Recherchez les dossiers, vérifiez leur statut et leurs périodes."
        }
      >
        <QueryNotice
          locale={locale}
          error={params.error}
          updated={params.updated}
        />
        {result.error ? (
          <SubscriptionDataError locale={locale} error={result.error} />
        ) : (
          <>
            {auditResult.error ? (
              <SubscriptionDataError
                locale={locale}
                error={auditResult.error}
              />
            ) : null}
            {cashResult.error ? (
              <SubscriptionDataError locale={locale} error={cashResult.error} />
            ) : null}
            {(cashResult.data ?? []).some(
              (item) => item.status === "awaiting_cash_confirmation",
            ) ? (
              <section className="subscription-panel">
                <div className="subscription-panel-heading">
                  <div>
                    <p className="subscription-eyebrow">
                      {ar ? "الدفع نقدًا" : "PAIEMENTS EN ESPÈCES"}
                    </p>
                    <h2>
                      {ar
                        ? "طلبات بانتظار تأكيد الاستلام"
                        : "Demandes à confirmer"}
                    </h2>
                  </div>
                </div>
                <div className="subscription-record-list">
                  {(cashResult.data ?? [])
                    .filter(
                      (item) => item.status === "awaiting_cash_confirmation",
                    )
                    .map((item) => (
                      <article className="subscription-record" key={item.id}>
                        <div className="subscription-record-main">
                          <div>
                            <h2>
                              {item.professional_name ??
                                (ar ? "حساب مهني" : "Compte professionnel")}
                            </h2>
                            <p>
                              {item.establishment_name ??
                                (ar ? "لا توجد مؤسسة" : "Aucun établissement")}
                            </p>
                          </div>
                          <SubscriptionStatusBadge
                            status={item.status}
                            locale={locale}
                          />
                        </div>
                        <div className="subscription-record-facts">
                          <div>
                            <span>{ar ? "الخطة" : "Formule"}</span>
                            <strong>{item.plan_name_snapshot}</strong>
                          </div>
                          <div>
                            <span>{ar ? "المبلغ" : "Montant"}</span>
                            <strong>
                              {item.plan_price_snapshot}{" "}
                              {item.plan_currency_code_snapshot}
                            </strong>
                          </div>
                          <div>
                            <span>{ar ? "تاريخ الطلب" : "Demande"}</span>
                            <strong>
                              {formatSubscriptionDateTime(
                                item.created_at,
                                locale,
                              )}
                            </strong>
                          </div>
                        </div>
                        <form
                          action={confirmCashPayment}
                          className="subscription-inline-form"
                        >
                          <input
                            type="hidden"
                            name="subscription_id"
                            value={item.id}
                          />
                          <label>
                            {ar ? "ملاحظة التأكيد" : "Note de confirmation"}
                            <input name="note" maxLength={500} />
                          </label>
                          <button
                            className="button button-primary"
                            type="submit"
                          >
                            {ar
                              ? "تأكيد استلام النقد"
                              : "Confirmer l’argent reçu"}
                          </button>
                        </form>
                      </article>
                    ))}
                </div>
              </section>
            ) : null}
            <form
              className="subscription-filters"
              action="/subscriptions"
              method="get"
            >
              <input type="hidden" name="section" value="subscriptions" />
              <label>
                {ar ? "بحث" : "Recherche"}
                <input
                  type="search"
                  name="q"
                  defaultValue={params.q}
                  placeholder={
                    ar
                      ? "المهني أو المؤسسة أو الخطة"
                      : "Professionnel, établissement ou formule"
                  }
                />
              </label>
              <label>
                {ar ? "الحالة" : "Statut"}
                <select name="status" defaultValue={params.status ?? ""}>
                  {statusOptions.map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <button className="button button-secondary" type="submit">
                {ar ? "تصفية" : "Filtrer"}
              </button>
              <span className="subscription-result-count">
                {filtered.length} / {all.length}
              </span>
            </form>
            {filtered.length === 0 ? (
              <SubscriptionEmptyState
                title={
                  all.length === 0
                    ? ar
                      ? "لا توجد اشتراكات"
                      : "Aucun abonnement enregistré"
                    : ar
                      ? "لا توجد نتائج"
                      : "Aucun résultat"
                }
                description={
                  all.length === 0
                    ? ar
                      ? "ستظهر سجلات الاشتراك هنا عند إنشائها."
                      : "Les dossiers apparaîtront ici lorsqu’ils seront créés."
                    : ar
                      ? "غيّر معايير البحث أو التصفية."
                      : "Modifiez vos critères de recherche ou de statut."
                }
              />
            ) : (
              <div className="subscription-record-list">
                {filtered.map((item) => (
                  <article className="subscription-record" key={item.id}>
                    <div className="subscription-record-main">
                      <div className="subscription-record-identity">
                        <span
                          className="subscription-avatar"
                          aria-hidden="true"
                        >
                          {(item.professional_name ?? "—")
                            .slice(0, 1)
                            .toLocaleUpperCase(locale)}
                        </span>
                        <div>
                          <h2>
                            {item.professional_name ??
                              (ar ? "حساب مهني" : "Compte professionnel")}
                          </h2>
                          <p>
                            {item.establishment_name ??
                              (ar
                                ? "لا توجد مؤسسة"
                                : "Aucun établissement renseigné")}
                          </p>
                        </div>
                      </div>
                      <SubscriptionStatusBadge
                        status={item.effective_status}
                        locale={locale}
                      />
                    </div>
                    <div className="subscription-record-facts">
                      <div>
                        <span>{ar ? "الخطة" : "Formule"}</span>
                        <strong>{item.plan_name_snapshot}</strong>
                        <small>{item.plan_key}</small>
                      </div>
                      <div>
                        <span>{ar ? "السعر المحفوظ" : "Prix du snapshot"}</span>
                        <strong>
                          {item.plan_price_snapshot}{" "}
                          {item.plan_currency_code_snapshot}
                        </strong>
                        <small>
                          {item.plan_duration_days_snapshot}{" "}
                          {ar ? "يومًا" : "jours"}
                        </small>
                      </div>
                      <div>
                        <span>{ar ? "البداية" : "Début"}</span>
                        <strong>
                          {formatSubscriptionDate(item.starts_at, locale)}
                        </strong>
                      </div>
                      <div>
                        <span>{ar ? "الانتهاء" : "Expiration"}</span>
                        <strong>
                          {formatSubscriptionDate(item.expires_at, locale)}
                        </strong>
                      </div>
                      <div>
                        <span>{ar ? "المصدر" : "Origine"}</span>
                        <strong>
                          {auditResult.error
                            ? "—"
                            : (sourceBySubscriptionId.get(item.id) ??
                              (ar ? "غير محدد" : "Non renseignée"))}
                        </strong>
                      </div>
                    </div>
                    {["active", "suspended"].includes(item.effective_status) &&
                    item.starts_at &&
                    item.expires_at ? (
                      <details className="subscription-admin-details">
                        <summary>
                          {ar ? "تعديل الفترة" : "Ajuster la période"}
                        </summary>
                        <form
                          action={setSubscriptionPeriod}
                          className="subscription-inline-form"
                        >
                          <input
                            type="hidden"
                            name="subscription_id"
                            value={item.id}
                          />
                          <label>
                            {ar
                              ? "البداية (توقيت الجزائر)"
                              : "Début (heure d’Algérie)"}
                            <input
                              name="starts_at_local"
                              type="datetime-local"
                              defaultValue={localDateInput(item.starts_at)}
                              required
                            />
                          </label>
                          <label>
                            {ar
                              ? "النهاية (توقيت الجزائر)"
                              : "Fin (heure d’Algérie)"}
                            <input
                              name="expires_at_local"
                              type="datetime-local"
                              defaultValue={localDateInput(item.expires_at)}
                              required
                            />
                          </label>
                          <label>
                            {ar ? "سبب التعديل" : "Motif de l’ajustement"}
                            <input
                              name="reason"
                              minLength={3}
                              maxLength={500}
                              required
                            />
                          </label>
                          <button
                            className="button button-secondary"
                            type="submit"
                          >
                            {ar ? "حفظ الفترة" : "Enregistrer la période"}
                          </button>
                        </form>
                      </details>
                    ) : null}
                    {["active", "suspended"].includes(item.effective_status) ? (
                      <details className="subscription-admin-details">
                        <summary>
                          {item.effective_status === "active"
                            ? ar
                              ? "تعليق الاشتراك"
                              : "Suspendre l’abonnement"
                            : ar
                              ? "إعادة تفعيل الاشتراك"
                              : "Réactiver l’abonnement"}
                        </summary>
                        <form
                          action={setSubscriptionSuspension}
                          className="subscription-inline-form"
                        >
                          <input
                            type="hidden"
                            name="subscription_id"
                            value={item.id}
                          />
                          <input
                            type="hidden"
                            name="suspend"
                            value={
                              item.effective_status === "active"
                                ? "true"
                                : "false"
                            }
                          />
                          <label>
                            {ar
                              ? "سبب إداري إلزامي"
                              : "Motif d’administration obligatoire"}
                            <input
                              name="reason"
                              minLength={3}
                              maxLength={500}
                              required
                            />
                          </label>
                          <button
                            className="button button-secondary"
                            type="submit"
                          >
                            {item.effective_status === "active"
                              ? ar
                                ? "تعليق"
                                : "Suspendre"
                              : ar
                                ? "إعادة التفعيل"
                                : "Réactiver"}
                          </button>
                        </form>
                      </details>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </SubscriptionWorkspace>
    );
  }

  if (section === "codes") {
    const [codeResult, planResult] = await Promise.all([
      supabase.rpc("admin_list_activation_codes"),
      supabase.rpc("admin_list_subscription_plans_v2"),
    ]);
    const plans = (planResult.data ?? []).filter(
      (plan) => plan.plan_key !== "v1-unconfigured",
    );
    const issuablePlans = plans.filter(
      (
        plan,
      ): plan is typeof plan & {
        display_name: string;
        price_amount: number;
        currency_code: string;
      } =>
        plan.is_active &&
        plan.display_name !== null &&
        plan.price_amount !== null &&
        plan.currency_code !== null,
    );
    const planNames = new Map(
      plans.map((plan) => [plan.plan_key, plan.display_name]),
    );
    return (
      <SubscriptionWorkspace
        locale={locale}
        active="codes"
        title={copy.sections.codes}
        description={
          ar
            ? "أصدر رموزًا مرتبطة بخطة منشورة وتابع صلاحيتها واستخدامها."
            : "Émettez des codes liés à une formule publiée et suivez leur validité et leur utilisation."
        }
      >
        <QueryNotice
          locale={locale}
          error={params.error}
          updated={params.updated}
        />
        <IssueCodeForm
          plans={issuablePlans}
          plansError={planResult.error?.message}
          plansErrorCode={planResult.error?.code}
          locale={locale}
        />
        {codeResult.error ? (
          <SubscriptionDataError locale={locale} error={codeResult.error} />
        ) : codeResult.data?.length ? (
          <section
            className="subscription-record-list"
            aria-label={copy.sections.codes}
          >
            {codeResult.data.map((code) => (
              <article className="subscription-record" key={code.id}>
                <div className="subscription-record-main">
                  <div>
                    <p className="subscription-eyebrow">
                      {ar ? "رمز تفعيل" : "CODE D’ACTIVATION"}
                    </p>
                    <h2>{planNames.get(code.plan_key) ?? code.plan_key}</h2>
                  </div>
                  <SubscriptionStatusBadge
                    status={code.status}
                    locale={locale}
                  />
                </div>
                <div className="subscription-record-facts">
                  <div>
                    <span>{ar ? "الاستخدامات" : "Utilisations"}</span>
                    <strong>
                      {code.usage_count} / {code.usage_limit}
                    </strong>
                  </div>
                  <div>
                    <span>{ar ? "صالح من" : "Valide à partir du"}</span>
                    <strong>
                      {formatSubscriptionDateTime(code.valid_from, locale)}
                    </strong>
                  </div>
                  <div>
                    <span>{ar ? "Expiration" : "Expiration"}</span>
                    <strong>
                      {formatSubscriptionDateTime(code.valid_until, locale)}
                    </strong>
                  </div>
                  <div>
                    <span>{ar ? "تاريخ الإصدار" : "Émis le"}</span>
                    <strong>
                      {formatSubscriptionDateTime(code.issued_at, locale)}
                    </strong>
                  </div>
                </div>
                {code.status === "active" ? (
                  <form action={revokeActivationCode}>
                    <input type="hidden" name="code_id" value={code.id} />
                    <button className="button button-secondary" type="submit">
                      {ar ? "إلغاء الرمز" : "Révoquer le code"}
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </section>
        ) : (
          <SubscriptionEmptyState
            title={ar ? "لا توجد رموز صادرة" : "Aucun code émis"}
            description={
              ar
                ? "ستظهر الرموز هنا بعد إصدارها من خلال الخطة المنشورة."
                : "Les codes apparaîtront ici après leur émission à partir d’une formule publiée."
            }
          />
        )}
      </SubscriptionWorkspace>
    );
  }

  if (section === "proofs") {
    const proofResult = await supabase.rpc(
      "admin_list_subscription_payment_proofs",
    );
    const signedProofs = await Promise.all(
      (proofResult.data ?? []).map(async (proof) => {
        const activationStateResult =
          proof.review_status === "approved"
            ? await supabase.rpc("admin_professional_activation_state", {
                target_user_id: proof.professional_user_id,
              })
            : null;
        if (!proof.object_path) {
          return {
            proof,
            signedUrl: null,
            signedError: null,
            activationState: activationStateResult?.data?.[0] ?? null,
          };
        }
        const { data, error } = await supabase.storage
          .from("subscription-payment-proofs")
          .createSignedUrl(proof.object_path, 900);
        return {
          proof,
          signedUrl: data?.signedUrl ?? null,
          signedError: error?.message ?? null,
          activationState: activationStateResult?.data?.[0] ?? null,
        };
      }),
    );
    return (
      <SubscriptionWorkspace
        locale={locale}
        active="proofs"
        title={copy.sections.proofs}
        description={
          ar
            ? "راجع مراجع الدفع والمرفقات ثم وافق أو ارفض بسبب واضح."
            : "Vérifiez les références et justificatifs, puis approuvez ou refusez avec un motif."
        }
      >
        <QueryNotice
          locale={locale}
          error={params.error}
          updated={params.updated}
        />
        {proofResult.error ? (
          <SubscriptionDataError locale={locale} error={proofResult.error} />
        ) : signedProofs.length ? (
          <section
            className="subscription-record-list"
            aria-label={copy.sections.proofs}
          >
            {signedProofs.map(
              ({ proof, signedUrl, signedError, activationState }) => (
                <article className="subscription-record" key={proof.proof_id}>
                  <div className="subscription-record-main">
                    <div className="subscription-record-identity">
                      <span className="subscription-avatar" aria-hidden="true">
                        {(proof.professional_name ?? "—")
                          .slice(0, 1)
                          .toLocaleUpperCase(locale)}
                      </span>
                      <div>
                        <h2>
                          {proof.professional_name ??
                            (ar ? "حساب مهني" : "Compte professionnel")}
                        </h2>
                        <p>
                          {proof.establishment_name ??
                            (ar
                              ? "لا توجد مؤسسة"
                              : "Aucun établissement renseigné")}
                        </p>
                      </div>
                    </div>
                    <SubscriptionStatusBadge
                      status={proof.review_status}
                      locale={locale}
                    />
                  </div>
                  <div className="subscription-record-facts">
                    <div>
                      <span>{ar ? "الخطة" : "Formule"}</span>
                      <strong>{proof.plan_name_snapshot}</strong>
                    </div>
                    <div>
                      <span>
                        {ar
                          ? "قيمة الخطة المحفوظة"
                          : "Montant du plan enregistré"}
                      </span>
                      <strong>
                        {proof.plan_price_snapshot}{" "}
                        {proof.plan_currency_code_snapshot}
                      </strong>
                    </div>
                    <div>
                      <span>{ar ? "طريقة الدفع" : "Moyen de paiement"}</span>
                      <strong>{proof.method_key}</strong>
                    </div>
                    <div>
                      <span>{ar ? "تاريخ الإرسال" : "Envoyé le"}</span>
                      <strong>
                        {formatSubscriptionDateTime(proof.submitted_at, locale)}
                      </strong>
                    </div>
                  </div>
                  {proof.transaction_reference ? (
                    <p className="subscription-proof-reference">
                      {ar ? "مرجع العملية" : "Référence de transaction"} ·{" "}
                      <code>{proof.transaction_reference}</code>
                    </p>
                  ) : null}
                  <div className="subscription-proof-attachment">
                    {signedUrl ? (
                      <a
                        className="button button-secondary"
                        href={signedUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {ar
                          ? "فتح المرفق المؤقت"
                          : "Ouvrir le justificatif temporaire"}
                      </a>
                    ) : signedError ? (
                      <p className="subscription-inline-error" role="alert">
                        {ar
                          ? "تعذر إنشاء رابط آمن للمرفق"
                          : "Lien sécurisé indisponible"}{" "}
                        · {signedError}
                      </p>
                    ) : (
                      <span>{ar ? "لا يوجد مرفق" : "Aucun fichier joint"}</span>
                    )}
                  </div>
                  {proof.review_status === "pending" ? (
                    <div className="subscription-proof-actions">
                      <form action={reviewManualPaymentProof}>
                        <input
                          type="hidden"
                          name="proof_id"
                          value={proof.proof_id}
                        />
                        <button
                          className="button button-primary"
                          name="decision"
                          value="approve"
                          type="submit"
                        >
                          {ar
                            ? "الموافقة على الدفع وتفعيل المهني"
                            : "Approuver le paiement et activer le professionnel"}
                        </button>
                      </form>
                      <form
                        action={reviewManualPaymentProof}
                        className="subscription-reject-form"
                      >
                        <input
                          type="hidden"
                          name="proof_id"
                          value={proof.proof_id}
                        />
                        <label>
                          {ar
                            ? "سبب الرفض (إلزامي)"
                            : "Motif du refus (obligatoire)"}
                          <input
                            name="rejection_reason"
                            minLength={3}
                            maxLength={500}
                            required
                          />
                        </label>
                        <button
                          className="button button-danger"
                          name="decision"
                          value="reject"
                          type="submit"
                        >
                          {ar ? "رفض الإثبات" : "Refuser la preuve"}
                        </button>
                      </form>
                    </div>
                  ) : proof.rejection_reason ? (
                    <p className="subscription-inline-error">
                      {ar ? "سبب الرفض" : "Motif du refus"} ·{" "}
                      {proof.rejection_reason}
                    </p>
                  ) : null}
                  {proof.review_status === "approved" && activationState ? (
                    <p className="subscription-inline-note">
                      {activationState.has_valid_coordinates
                        ? ar
                          ? "المؤسسة منشورة وقابلة للاكتشاف. الخريطة جاهزة بإحداثيات صالحة."
                          : "Établissement publié et découvrable. La carte dispose de coordonnées valides."
                        : ar
                          ? "المؤسسة منشورة وقابلة للاكتشاف، لكن لا توجد إحداثيات صالحة لعرضها على الخريطة."
                          : "Établissement publié et découvrable, mais aucune coordonnée valide pour le marqueur de carte."}
                    </p>
                  ) : null}
                </article>
              ),
            )}
          </section>
        ) : (
          <SubscriptionEmptyState
            title={ar ? "لا توجد إثباتات دفع" : "Aucune preuve de paiement"}
            description={
              ar
                ? "ستظهر الطلبات المرسلة هنا لمراجعتها."
                : "Les justificatifs soumis apparaîtront ici pour examen."
            }
          />
        )}
      </SubscriptionWorkspace>
    );
  }

  return (
    <SubscriptionWorkspace
      locale={locale}
      active="plans"
      title={copy.sections.plans}
      description={
        ar
          ? "إدارة الأسعار والمدد والمزايا المعتمدة للمهنيين."
          : "Gérez les tarifs, durées et avantages approuvés pour les professionnels."
      }
    >
      <div className="subscription-panel">
        <p>
          {ar
            ? "تتم إدارة الخطط من مساحة مخصصة."
            : "Les formules disposent d’un espace de gestion dédié."}
        </p>
        <Link className="button button-primary" href="/subscriptions/plans">
          {ar ? "فتح إدارة الخطط" : "Ouvrir la gestion des formules"}
        </Link>
      </div>
    </SubscriptionWorkspace>
  );
}
