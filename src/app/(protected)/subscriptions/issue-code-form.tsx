"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { AdminLocale } from "@/i18n/messages";
import { issueActivationCode } from "./actions";

type Plan = {
  plan_key: string;
  display_name: string;
  price_amount: number;
  currency_code: string;
};

export function IssueCodeForm({
  plans,
  plansError,
  plansErrorCode,
  locale,
}: {
  plans: Plan[];
  plansError?: string;
  plansErrorCode?: string;
  locale: AdminLocale;
}) {
  const [state, action, pending] = useActionState(issueActivationCode, {});
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const ar = locale === "ar";

  async function copyCode() {
    if (!state.code) return;
    try {
      await navigator.clipboard.writeText(state.code);
      setCopied(true);
      setCopyError("");
    } catch {
      setCopied(false);
      setCopyError(
        ar
          ? "تعذر النسخ تلقائيًا. حدد الرمز وانسخه يدويًا."
          : "Copie automatique indisponible. Sélectionnez le code pour le copier manuellement.",
      );
    }
  }

  return (
    <section className="subscription-panel" id="activation-issuer">
      <div className="subscription-panel-heading">
        <div>
          <p className="subscription-eyebrow">
            {ar ? "إصدار آمن" : "ÉMISSION SÉCURISÉE"}
          </p>
          <h2>{ar ? "إصدار رمز تفعيل" : "Émettre un code d’activation"}</h2>
        </div>
      </div>
      {plansError ? (
        <div className="subscription-inline-error" role="alert">
          <strong>
            {ar
              ? "تعذر تحميل الخطط المؤهلة"
              : "Formules éligibles indisponibles"}
          </strong>
          <p>
            {plansErrorCode === "42501"
              ? ar
                ? "لا تملك جلستك صلاحية قراءة الخطط."
                : "Votre session n’est pas autorisée à lire les formules."
              : [
                    "PGRST202",
                    "PGRST204",
                    "PGRST205",
                    "42883",
                    "42703",
                    "42P01",
                  ].includes(plansErrorCode ?? "")
                ? ar
                  ? "تحقق من تطبيق ترحيل كتالوج الخطط في قاعدة البيانات."
                  : "Vérifiez que la migration du catalogue de formules est appliquée à la base."
                : plansError}
          </p>
        </div>
      ) : plans.length === 0 ? (
        <div className="subscription-empty subscription-empty-compact">
          <h3>{ar ? "لا توجد خطة منشورة" : "Aucune formule publiée"}</h3>
          <p>
            {ar
              ? "انشر خطة معتمدة أولاً لإصدار رمز مرتبط بها."
              : "Publiez d’abord une formule approuvée pour lui associer un code."}
          </p>
          <Link
            className="button button-secondary"
            href="/subscriptions/plans#create-plan"
          >
            {ar ? "إدارة الخطط" : "Gérer les formules"}
          </Link>
        </div>
      ) : (
        <form action={action} className="subscription-code-form">
          <label>
            {ar ? "الخطة المنشورة" : "Formule publiée"}
            <select name="plan_key" required defaultValue={plans[0].plan_key}>
              {plans.map((plan) => (
                <option key={plan.plan_key} value={plan.plan_key}>
                  {plan.display_name} · {plan.price_amount} {plan.currency_code}
                </option>
              ))}
            </select>
          </label>
          <label>
            {ar ? "صالح ابتداءً من" : "Valide à partir du"}
            <input name="valid_from" type="datetime-local" />
          </label>
          <label>
            {ar
              ? "تاريخ الانتهاء (اختياري)"
              : "Date d’expiration (facultative)"}
            <input name="valid_until" type="datetime-local" />
          </label>
          <input type="hidden" name="usage_limit" value="1" />
          <p className="subscription-form-note">
            {ar
              ? "كل رمز صالح لاستخدام واحد فقط."
              : "Chaque code est limité à une seule utilisation."}
          </p>
          <button
            className="button button-primary"
            disabled={pending}
            type="submit"
          >
            {pending
              ? ar
                ? "جارٍ الإصدار…"
                : "Émission…"
              : ar
                ? "إصدار الرمز"
                : "Émettre le code"}
          </button>
          {state.error ? (
            <p className="subscription-flash is-error" role="alert">
              {state.error === "permission_denied"
                ? ar
                  ? "هذه العملية تتطلب صلاحية المسؤول."
                  : "Cette opération nécessite une autorisation Admin."
                : state.error === "migration_missing"
                  ? ar
                    ? "ترحيل قاعدة البيانات الخاص بإصدار الرموز غير مطبق."
                    : "La migration de base de données requise pour émettre les codes est absente."
                  : state.error === "invalid_policy"
                    ? ar
                      ? "تحقق من الخطة وتواريخ الصلاحية."
                      : "Vérifiez la formule et les dates de validité."
                    : ar
                      ? "تعذر إصدار الرمز. تحقق من نشر الخطة."
                      : "Émission impossible. Vérifiez que la formule est publiée."}
            </p>
          ) : null}
        </form>
      )}
      {state.code ? (
        <div className="subscription-issued-code" role="status">
          <div>
            <strong>
              {ar ? "يُعرض الرمز مرة واحدة فقط" : "Code affiché une seule fois"}
            </strong>
            <p>
              {ar
                ? "انسخه الآن؛ لا تحفظ قاعدة البيانات النص الصريح."
                : "Copiez-le maintenant : la base ne conserve pas le code en clair."}
            </p>
          </div>
          <code dir="ltr">{state.code}</code>
          <button
            className="button button-secondary"
            onClick={() => void copyCode()}
            type="button"
          >
            {copied
              ? ar
                ? "تم النسخ"
                : "Copié"
              : ar
                ? "نسخ الرمز"
                : "Copier le code"}
          </button>
          {copyError ? <p role="alert">{copyError}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
