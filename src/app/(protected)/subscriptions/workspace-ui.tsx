import Link from "next/link";
import type { ReactNode } from "react";
import type { AdminLocale } from "@/i18n/messages";

export type SubscriptionSection =
  "overview" | "plans" | "subscriptions" | "codes" | "proofs";

const copy = {
  fr: {
    breadcrumb: "Admin / Gestion commerciale",
    sections: {
      overview: "Vue d’ensemble",
      plans: "Formules",
      subscriptions: "Abonnements",
      codes: "Codes d’activation",
      proofs: "Preuves de paiement",
    },
    sectionLabel: "GESTION DES ABONNEMENTS",
    moduleTitle: "Abonnements",
    moduleDescription:
      "Suivez les formules, les abonnements professionnels et les opérations de paiement.",
    databaseUnavailable: "Données indisponibles",
    permissionError:
      "Votre session ne dispose pas des autorisations nécessaires.",
    migrationError:
      "La base ne reconnaît pas encore cette fonction ou ces champs. Vérifiez les migrations du projet avant de réessayer.",
    queryError: "La lecture des données a échoué.",
  },
  ar: {
    breadcrumb: "الإدارة / الإدارة التجارية",
    sections: {
      overview: "نظرة عامة",
      plans: "الخطط",
      subscriptions: "الاشتراكات",
      codes: "رموز التفعيل",
      proofs: "إثباتات الدفع",
    },
    sectionLabel: "إدارة الاشتراكات",
    moduleTitle: "الاشتراكات",
    moduleDescription:
      "تابع الخطط واشتراكات المهنيين وعمليات الدفع من مساحة واحدة.",
    databaseUnavailable: "البيانات غير متاحة",
    permissionError: "لا تملك جلستك الصلاحيات المطلوبة.",
    migrationError:
      "قاعدة البيانات لا تتعرف على هذه الوظيفة أو الحقول بعد. تحقق من ترحيلات المشروع قبل إعادة المحاولة.",
    queryError: "تعذرت قراءة البيانات.",
  },
} as const;

export function subscriptionCopy(locale: AdminLocale) {
  return copy[locale];
}

export function subscriptionQueryError(
  locale: AdminLocale,
  error: { code?: string; message: string },
) {
  const text = copy[locale];
  if (
    error.code === "42501" ||
    /admin_required|permission denied/i.test(error.message)
  ) {
    return text.permissionError;
  }
  if (
    ["PGRST202", "PGRST204", "PGRST205", "42883", "42703", "42P01"].includes(
      error.code ?? "",
    ) ||
    /schema cache|could not find the function|does not exist/i.test(
      error.message,
    )
  ) {
    return text.migrationError;
  }
  return `${text.queryError} ${error.message}`;
}

export function SubscriptionSectionNav({
  locale,
  active,
}: {
  locale: AdminLocale;
  active: SubscriptionSection;
}) {
  const text = copy[locale];
  const sections: SubscriptionSection[] = [
    "overview",
    "plans",
    "subscriptions",
    "codes",
    "proofs",
  ];
  return (
    <nav
      aria-label={
        locale === "ar" ? "أقسام الاشتراكات" : "Sections des abonnements"
      }
      className="subscription-tabs"
    >
      {sections.map((section) => (
        <Link
          aria-current={active === section ? "page" : undefined}
          className={`subscription-tab${active === section ? " is-active" : ""}`}
          href={
            section === "plans"
              ? "/subscriptions/plans"
              : section === "overview"
                ? "/subscriptions"
                : `/subscriptions?section=${section}`
          }
          key={section}
        >
          {text.sections[section]}
        </Link>
      ))}
    </nav>
  );
}

export function SubscriptionWorkspace({
  locale,
  active,
  title,
  description,
  action,
  children,
}: {
  locale: AdminLocale;
  active: SubscriptionSection;
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const text = copy[locale];
  return (
    <main
      className="subscription-workspace"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <header className="subscription-workspace-header">
        <nav className="subscription-breadcrumb" aria-label={text.breadcrumb}>
          <Link href="/admin">{locale === "ar" ? "الرئيسية" : "Accueil"}</Link>
          <span aria-hidden="true">/</span>
          <span>{text.breadcrumb.split(" / ")[1]}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{text.sections[active]}</span>
        </nav>
        <div className="subscription-title-row">
          <div>
            <p className="subscription-eyebrow">{text.sectionLabel}</p>
            <h1>{title}</h1>
            <p className="subscription-description">{description}</p>
          </div>
          {action ? (
            <div className="subscription-header-action">{action}</div>
          ) : null}
        </div>
        <SubscriptionSectionNav locale={locale} active={active} />
      </header>
      {children}
    </main>
  );
}

export function SubscriptionDataError({
  locale,
  error,
}: {
  locale: AdminLocale;
  error: { code?: string; message: string };
}) {
  const text = copy[locale];
  return (
    <section
      className="subscription-state subscription-state-error"
      role="alert"
    >
      <span className="subscription-state-icon" aria-hidden="true">
        !
      </span>
      <div>
        <h2>{text.databaseUnavailable}</h2>
        <p>{subscriptionQueryError(locale, error)}</p>
      </div>
    </section>
  );
}

export function SubscriptionEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="subscription-empty">
      <span className="subscription-empty-mark" aria-hidden="true">
        —
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function SubscriptionMetric({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: number | null;
  detail: string;
  tone?: "default" | "coral" | "amber" | "green";
}) {
  return (
    <article className={`subscription-metric tone-${tone}`}>
      <p>{label}</p>
      {value === null ? (
        <span className="subscription-metric-unavailable" aria-label={detail}>
          —
        </span>
      ) : (
        <strong>{new Intl.NumberFormat().format(value)}</strong>
      )}
      <span>{detail}</span>
    </article>
  );
}

export function formatSubscriptionDate(
  value: string | null,
  locale: AdminLocale,
) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
    dateStyle: "medium",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export function formatSubscriptionDateTime(
  value: string | null,
  locale: AdminLocale,
) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}
