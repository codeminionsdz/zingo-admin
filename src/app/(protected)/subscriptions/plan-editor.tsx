"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import type { Database } from "@/lib/shared/database";
import type { AdminLocale } from "@/i18n/messages";

type Plan =
  Database["public"]["Functions"]["admin_list_subscription_plans_v2"]["Returns"][number];
type PlanAction = (formData: FormData) => void | Promise<void>;

function SavePlanButton({
  locale,
  editing,
}: {
  locale: AdminLocale;
  editing: boolean;
}) {
  const { pending } = useFormStatus();
  const ar = locale === "ar";
  return (
    <button className="button button-primary" disabled={pending} type="submit">
      {pending
        ? ar
          ? "جارٍ الحفظ…"
          : "Enregistrement…"
        : editing
          ? ar
            ? "حفظ التعديلات"
            : "Enregistrer les modifications"
          : ar
            ? "إنشاء الخطة"
            : "Créer la formule"}
    </button>
  );
}

export function PlanEditor({
  plan,
  locale,
  action,
}: {
  plan?: Plan;
  locale: AdminLocale;
  action: PlanAction;
}) {
  const ar = locale === "ar";
  const [name, setName] = useState(plan?.display_name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [price, setPrice] = useState(plan?.price_amount?.toString() ?? "");
  const [duration, setDuration] = useState(
    (plan?.duration_value ?? plan?.duration_days)?.toString() ?? "",
  );
  const [unit, setUnit] = useState<"days" | "months">(
    plan?.duration_unit ?? "days",
  );
  const [badge, setBadge] = useState(plan?.badge_label ?? "");
  const [benefits, setBenefits] = useState(
    (plan?.included_benefits ?? []).map(String).join("\n"),
  );
  const [published, setPublished] = useState(plan?.is_active ?? false);
  const [order, setOrder] = useState(String(plan?.display_order ?? 0));
  const benefitList = benefits
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div className="subscription-plan-editor-layout">
      <form action={action} className="subscription-plan-editor">
        {plan ? (
          <input type="hidden" name="plan_key" value={plan.plan_key} />
        ) : null}
        <input type="hidden" name="currency_code" value="DZD" />
        <div className="subscription-form-section">
          <p className="subscription-eyebrow">
            {ar ? "معلومات الخطة" : "INFORMATIONS DE L’OFFRE"}
          </p>
          <div className="subscription-form-grid">
            <label className="subscription-form-wide">
              {ar ? "اسم الخطة" : "Nom de la formule"}
              <input
                name="display_name"
                required
                minLength={1}
                maxLength={120}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={
                  ar
                    ? "اسم واضح للمهنيين"
                    : "Un nom clair pour les professionnels"
                }
              />
            </label>
            <label className="subscription-form-wide">
              {ar ? "الوصف" : "Description"}
              <textarea
                name="description"
                required
                maxLength={2000}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <label>
              {ar ? "السعر (دج)" : "Prix (DZD)"}
              <input
                name="price_amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </label>
            <div className="subscription-duration-field">
              <label>
                {ar ? "المدة" : "Durée"}
                <input
                  name="duration_value"
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  required
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                />
              </label>
              <label>
                {ar ? "الوحدة" : "Unité"}
                <select
                  name="duration_unit"
                  value={unit}
                  onChange={(event) =>
                    setUnit(event.target.value as "days" | "months")
                  }
                >
                  <option value="days">{ar ? "أيام" : "Jours"}</option>
                  <option value="months">{ar ? "أشهر" : "Mois"}</option>
                </select>
              </label>
            </div>
            <label>
              {ar ? "شارة اختيارية" : "Badge facultatif"}
              <input
                name="badge_label"
                maxLength={60}
                value={badge}
                onChange={(event) => setBadge(event.target.value)}
                placeholder={ar ? "اختياري" : "Ex. : Populaire"}
              />
            </label>
            <label>
              {ar ? "ترتيب العرض" : "Ordre d’affichage"}
              <input
                name="display_order"
                type="number"
                min="0"
                max="32767"
                step="1"
                required
                value={order}
                onChange={(event) => setOrder(event.target.value)}
              />
            </label>
            <label className="subscription-form-wide">
              {ar
                ? "المزايا (ميزة واحدة في كل سطر)"
                : "Avantages (un par ligne)"}
              <textarea
                name="included_benefits"
                rows={4}
                value={benefits}
                onChange={(event) => setBenefits(event.target.value)}
                aria-describedby="subscription-benefits-help"
              />
              <small id="subscription-benefits-help">
                {ar
                  ? "20 ميزة كحد أقصى، 160 حرفًا لكل ميزة."
                  : "20 avantages maximum, 160 caractères par avantage."}
              </small>
            </label>
            <label className="subscription-publish-toggle subscription-form-wide">
              <input
                name="is_active"
                type="checkbox"
                value="true"
                checked={published}
                onChange={(event) => setPublished(event.target.checked)}
              />
              <span>
                <strong>
                  {ar
                    ? "نشر الخطة في التطبيق المهني"
                    : "Publier dans l’application professionnelle"}
                </strong>
                <small>
                  {ar
                    ? "ستظهر الخطة المنشورة للمهنيين."
                    : "La formule publiée sera visible des professionnels."}
                </small>
              </span>
            </label>
          </div>
        </div>
        <div className="subscription-editor-footer">
          <p>
            {ar
              ? "لا يتم تغيير الاشتراكات السابقة؛ تحتفظ بالشروط المحفوظة عند إنشائها."
              : "Les abonnements existants conservent leurs conditions enregistrées."}
          </p>
          <SavePlanButton locale={locale} editing={Boolean(plan)} />
        </div>
      </form>

      <aside
        className="subscription-plan-preview"
        aria-label={ar ? "معاينة الخطة" : "Aperçu de la formule"}
      >
        <p className="subscription-eyebrow">
          {ar ? "معاينة مباشرة" : "APERÇU EN DIRECT"}
        </p>
        <article className="subscription-preview-card">
          <div className="subscription-preview-top">
            <span>{ar ? "اشتراك مهني" : "ABONNEMENT PROFESSIONNEL"}</span>
            {badge ? <strong>{badge}</strong> : null}
          </div>
          <h3>{name || (ar ? "اسم الخطة" : "Nom de la formule")}</h3>
          <p>
            {description ||
              (ar
                ? "سيظهر وصف الخطة هنا."
                : "La description de l’offre apparaîtra ici.")}
          </p>
          <div className="subscription-preview-price">
            <strong>{price ? `${price} DZD` : "— DZD"}</strong>
            <span>
              {duration || "—"}{" "}
              {unit === "months"
                ? ar
                  ? "أشهر"
                  : "mois"
                : ar
                  ? "أيام"
                  : "jours"}
            </span>
          </div>
          {benefitList.length ? (
            <ul>
              {benefitList.map((benefit, index) => (
                <li key={`${index}-${benefit}`}>{benefit}</li>
              ))}
            </ul>
          ) : (
            <p className="subscription-preview-empty">
              {ar ? "لم تتم إضافة مزايا." : "Aucun avantage ajouté."}
            </p>
          )}
          <span
            className={`subscription-preview-state${published ? " is-published" : ""}`}
          >
            {published
              ? ar
                ? "منشورة"
                : "Publiée"
              : ar
                ? "مسودة"
                : "Brouillon"}
          </span>
        </article>
        <p className="subscription-preview-note">
          {ar
            ? "معاينة فقط — لا تُنشأ بيانات تجريبية."
            : "Aperçu uniquement — aucune donnée de démonstration n’est créée."}
        </p>
      </aside>
    </div>
  );
}
