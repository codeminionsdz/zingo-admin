import Link from "next/link";
import type { Database } from "@/lib/shared/database";
import { getAdminLocale } from "@/lib/admin-locale";
import { assertAdminPrincipal } from "@/lib/auth/assert-admin";
import { resolveAdminPrincipal } from "@/lib/auth/resolve-admin-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  archiveSubscriptionPlan,
  saveManualPaymentMethod,
  saveSubscriptionPlan,
} from "../actions";
import { PlanEditor } from "../plan-editor";
import {
  formatSubscriptionDateTime,
  SubscriptionDataError,
  SubscriptionEmptyState,
  SubscriptionWorkspace,
} from "../workspace-ui";

type Plan =
  Database["public"]["Functions"]["admin_list_subscription_plans_v2"]["Returns"][number];
type Method =
  Database["public"]["Functions"]["admin_list_manual_payment_methods"]["Returns"][number];

export const dynamic = "force-dynamic";

function PlanCard({ plan, locale }: { plan: Plan; locale: "fr" | "ar" }) {
  const ar = locale === "ar";
  return (
    <article className="subscription-plan-card">
      <div className="subscription-plan-card-heading">
        <div>
          <p className="subscription-eyebrow">
            {ar ? "ترتيب العرض" : "ORDRE"} · {plan.display_order}
          </p>
          <h2>
            {plan.display_name ?? (ar ? "خطة دون اسم" : "Formule sans nom")}
          </h2>
        </div>
        <span
          className={`subscription-status${plan.is_active ? " status-active" : " status-draft"}`}
        >
          <span aria-hidden="true" />
          {plan.is_active
            ? ar
              ? "منشورة"
              : "Publiée"
            : ar
              ? "مسودة"
              : "Brouillon"}
        </span>
      </div>
      {plan.badge_label ? (
        <span className="subscription-plan-card-badge">{plan.badge_label}</span>
      ) : null}
      <p className="subscription-plan-card-description">{plan.description}</p>
      <div className="subscription-plan-card-price">
        <strong>
          {plan.price_amount ?? "—"} <span>{plan.currency_code ?? "DZD"}</span>
        </strong>
        <span>
          {plan.duration_value ?? plan.duration_days ?? "—"}{" "}
          {plan.duration_unit === "months"
            ? ar
              ? "أشهر"
              : "mois"
            : ar
              ? "أيام"
              : "jours"}
        </span>
      </div>
      {plan.included_benefits.length ? (
        <ul className="subscription-benefit-list">
          {plan.included_benefits.map((benefit, index) => (
            <li key={`${plan.plan_key}-${index}`}>{String(benefit)}</li>
          ))}
        </ul>
      ) : (
        <p className="subscription-plan-no-benefits">
          {ar ? "لم تتم إضافة مزايا." : "Aucun avantage renseigné."}
        </p>
      )}
      <p className="subscription-plan-updated">
        {ar ? "آخر تحديث" : "Dernière mise à jour"} ·{" "}
        {formatSubscriptionDateTime(plan.updated_at, locale)}
      </p>
      <details className="subscription-plan-edit">
        <summary>{ar ? "تعديل الخطة" : "Modifier la formule"}</summary>
        <PlanEditor plan={plan} locale={locale} action={saveSubscriptionPlan} />
      </details>
      <form
        action={archiveSubscriptionPlan}
        className="subscription-plan-archive"
      >
        <input type="hidden" name="plan_key" value={plan.plan_key} />
        <button className="button button-danger-outline" type="submit">
          {ar ? "إلغاء النشر وأرشفة الخطة" : "Dépublier et archiver"}
        </button>
      </form>
    </article>
  );
}

function PaymentMethodForm({
  method,
  locale,
}: {
  method: Method;
  locale: "fr" | "ar";
}) {
  const ar = locale === "ar";
  const details = method.details ?? {};
  const detailFields =
    method.method_key === "ccp"
      ? [
          ["beneficiary_name", "Bénéficiaire"],
          ["account_number", "Numéro CCP"],
          ["account_key", "Clé CCP"],
        ]
      : method.method_key === "baridimob"
        ? [
            ["beneficiary_name", "Bénéficiaire"],
            ["receiving_identifier", "Téléphone ou identifiant"],
            ["receiving_details", "Détails de réception"],
          ]
        : method.method_key === "bank_transfer"
          ? [
              ["bank_name", "Nom de la banque"],
              ["beneficiary_name", "Bénéficiaire"],
              ["rib", "RIB"],
              ["iban", "IBAN"],
              ["swift_bic", "SWIFT / BIC"],
            ]
          : [
              ["recipient_name", "Responsable"],
              ["contact_info", "Contact"],
              ["location", "Lieu de paiement"],
            ];
  return (
    <article className="subscription-payment-method">
      <div>
        <h3>{method.display_name}</h3>
        <span
          className={`subscription-status${method.is_active ? " status-active" : " status-draft"}`}
        >
          <span aria-hidden="true" />
          {method.is_active
            ? ar
              ? "متاح"
              : "Disponible"
            : ar
              ? "معطّل"
              : "Désactivé"}
        </span>
      </div>
      <form
        action={saveManualPaymentMethod}
        className="subscription-method-form"
      >
        <input type="hidden" name="method_key" value={method.method_key} />
        <label>
          {ar ? "الاسم المعروض" : "Nom affiché"}
          <input
            name="display_name"
            required
            maxLength={80}
            defaultValue={method.display_name}
          />
        </label>
        <label>
          {ar ? "تعليمات الدفع" : "Instructions de paiement"}
          <textarea
            name="instructions_fr"
            maxLength={4000}
            rows={3}
            defaultValue={
              method.instructions_fr ?? method.payment_instructions ?? ""
            }
          />
        </label>
        <label>
          {ar ? "تعليمات بالعربية" : "Instructions en arabe"}
          <textarea
            name="instructions_ar"
            maxLength={4000}
            rows={3}
            defaultValue={method.instructions_ar ?? ""}
          />
        </label>
        <div className="subscription-method-details">
          {detailFields.map(([name, label]) => (
            <label key={name}>
              {ar ? name : label}
              <input
                name={name}
                defaultValue={String(details[name] ?? "")}
                maxLength={500}
              />
            </label>
          ))}
        </div>
        <label>
          {ar ? "ترتيب العرض" : "Ordre d’affichage"}
          <input
            name="display_order"
            type="number"
            min={0}
            max={32767}
            defaultValue={method.display_order ?? 0}
          />
        </label>
        <label className="subscription-publish-toggle">
          <input
            name="is_active"
            type="checkbox"
            value="true"
            defaultChecked={method.is_active}
          />
          <span>{ar ? "متاح للمهنيين" : "Disponible aux professionnels"}</span>
        </label>
        <button className="button button-secondary" type="submit">
          {ar ? "حفظ التعليمات" : "Enregistrer"}
        </button>
      </form>
    </article>
  );
}

export default async function SubscriptionPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const principal = await resolveAdminPrincipal();
  assertAdminPrincipal(principal);
  const [query, locale] = await Promise.all([searchParams, getAdminLocale()]);
  const ar = locale === "ar";
  const db = await createSupabaseServerClient();
  const [plansResult, methodsResult] = await Promise.all([
    db.rpc("admin_list_subscription_plans_v2"),
    db.rpc("admin_list_manual_payment_methods"),
  ]);
  const plans = (plansResult.data ?? []).filter(
    (plan) => plan.plan_key !== "v1-unconfigured",
  );

  const actionErrors: Record<string, [string, string]> = {
    invalid_plan: [
      "Vérifiez les informations de la formule.",
      "تحقق من معلومات الخطة.",
    ],
    migration_missing: [
      "La migration du catalogue de formules est absente. Demandez à l’administrateur du projet de vérifier les migrations appliquées ; aucune migration distante n’a été lancée.",
      "ترحيل كتالوج الخطط غير مطبق. اطلب من مسؤول المشروع التحقق من الترحيلات؛ لم يتم تشغيل أي ترحيل عن بُعد.",
    ],
    save_failed: ["La formule n’a pas pu être enregistrée.", "تعذر حفظ الخطة."],
    archive_failed: [
      "La formule n’a pas pu être archivée.",
      "تعذر أرشفة الخطة.",
    ],
    invalid_method: [
      "Vérifiez le nom et les instructions de paiement.",
      "تحقق من الاسم وتعليمات الدفع.",
    ],
  };
  const updates: Record<string, [string, string]> = {
    saved: ["Les modifications sont enregistrées.", "تم حفظ التعديلات."],
    archived: [
      "La formule a été archivée et retirée du catalogue professionnel.",
      "تمت أرشفة الخطة وإزالتها من كتالوج المهنيين.",
    ],
  };

  return (
    <SubscriptionWorkspace
      locale={locale}
      active="plans"
      title={ar ? "خطط الاشتراك" : "Formules d’abonnement"}
      description={
        ar
          ? "أدر العروض المقدمة للمهنيين."
          : "Gérez les offres proposées aux professionnels."
      }
      action={
        <Link className="button button-primary" href="#create-plan">
          {ar ? "إنشاء خطة" : "Créer une formule"}
        </Link>
      }
    >
      {query.error ? (
        <p className="subscription-flash is-error" role="alert">
          {actionErrors[query.error]?.[ar ? 1 : 0] ??
            (ar ? "تعذر إكمال العملية." : "L’opération n’a pas abouti.")}
        </p>
      ) : null}
      {query.updated ? (
        <p className="subscription-flash is-success" role="status">
          {updates[query.updated]?.[ar ? 1 : 0] ??
            (ar ? "تم حفظ التغيير." : "La modification a été enregistrée.")}
        </p>
      ) : null}
      {plansResult.error ? (
        <SubscriptionDataError locale={locale} error={plansResult.error} />
      ) : (
        <>
          <section className="subscription-plans-section">
            <div className="subscription-panel-heading">
              <div>
                <p className="subscription-eyebrow">
                  {ar ? "كتالوج المهنيين" : "CATALOGUE PROFESSIONNEL"}
                </p>
                <h2>{ar ? "الخطط المهيأة" : "Formules configurées"}</h2>
              </div>
              <span className="subscription-count-pill">
                {plans.length}{" "}
                {ar ? "خطة" : plans.length > 1 ? "formules" : "formule"}
              </span>
            </div>
            {plans.length ? (
              <div className="subscription-plans-grid">
                {plans.map((plan) => (
                  <PlanCard key={plan.plan_key} plan={plan} locale={locale} />
                ))}
              </div>
            ) : (
              <SubscriptionEmptyState
                title={
                  ar ? "لا توجد خطة مهيأة بعد" : "Aucune formule configurée"
                }
                description={
                  ar
                    ? "أنشئ خطة بالشروط التجارية المعتمدة قبل نشرها للمهنيين."
                    : "Créez une formule avec les conditions commerciales approuvées avant de la publier aux professionnels."
                }
                action={
                  <Link className="button button-primary" href="#create-plan">
                    {ar ? "إنشاء أول خطة" : "Créer la première formule"}
                  </Link>
                }
              />
            )}
          </section>

          <section className="subscription-create-panel" id="create-plan">
            <div className="subscription-panel-heading">
              <div>
                <p className="subscription-eyebrow">
                  {ar ? "إعداد العرض" : "CONFIGURATION DE L’OFFRE"}
                </p>
                <h2>{ar ? "إنشاء خطة" : "Créer une formule"}</h2>
                <p>
                  {ar
                    ? "أدخل الشروط المعتمدة فقط؛ لا يتم اقتراح أسعار أو مزايا."
                    : "Saisissez uniquement les conditions approuvées ; aucun prix ni avantage n’est suggéré."}
                </p>
              </div>
            </div>
            <PlanEditor locale={locale} action={saveSubscriptionPlan} />
          </section>
        </>
      )}

      <details className="subscription-payment-settings">
        <summary>
          {ar
            ? "إعداد وسائل الدفع اليدوية"
            : "Configurer les moyens de paiement manuels"}
        </summary>
        <p>
          {ar
            ? "لا تفعّل وسيلة دفع قبل إدخال التعليمات المعتمدة."
            : "N’activez un moyen de paiement qu’après avoir renseigné les instructions approuvées."}
        </p>
        {methodsResult.error ? (
          <SubscriptionDataError locale={locale} error={methodsResult.error} />
        ) : methodsResult.data?.length ? (
          <div className="subscription-method-grid">
            {methodsResult.data.map((method) => (
              <PaymentMethodForm
                key={method.method_key}
                method={method}
                locale={locale}
              />
            ))}
          </div>
        ) : (
          <SubscriptionEmptyState
            title={
              ar
                ? "لا توجد وسائل دفع مهيأة"
                : "Aucun moyen de paiement configuré"
            }
            description={
              ar
                ? "لم يعثر الاستعلام على وسائل دفع."
                : "La lecture n’a retourné aucun moyen de paiement."
            }
          />
        )}
      </details>
    </SubscriptionWorkspace>
  );
}
