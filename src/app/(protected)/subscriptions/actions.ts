"use server";

import { redirect } from "next/navigation";
import { assertAdminPrincipal } from "@/lib/auth/assert-admin";
import { resolveAdminPrincipal } from "@/lib/auth/resolve-admin-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function verifiedAdminClient() {
  const principal = await resolveAdminPrincipal();
  assertAdminPrincipal(principal);
  return createSupabaseServerClient();
}

export async function reviewManualPaymentProof(formData: FormData) {
  const proofId = String(formData.get("proof_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const reason = String(formData.get("rejection_reason") ?? "").trim();
  if (
    !/^[0-9a-f-]{36}$/i.test(proofId) ||
    !["approve", "reject"].includes(decision) ||
    (decision === "reject" && reason.length < 3)
  ) {
    redirect("/subscriptions?section=proofs&error=invalid_review");
  }
  const supabase = await verifiedAdminClient();
  const { error } = await supabase.rpc("review_manual_payment_proof", {
    target_proof_id: proofId,
    decision,
    rejection_reason: decision === "reject" ? reason : null,
  });
  const completenessErrors = new Set([
    "professional_profile_missing",
    "establishment_missing",
    "display_name_required",
    "contact_phone_required",
    "establishment_name_required",
    "address_required",
    "wilaya_required",
    "commune_required",
    "audience_required",
  ]);
  const errorKey =
    error?.code === "23514" &&
    error.message &&
    completenessErrors.has(error.message)
      ? `incomplete_${error.message}`
      : "review_failed";
  redirect(
    error
      ? `/subscriptions?section=proofs&error=${errorKey}`
      : decision === "approve"
        ? "/subscriptions?section=proofs&updated=activation"
        : "/subscriptions?section=proofs&updated=reviewed",
  );
}

export async function revokeActivationCode(formData: FormData) {
  const codeId = String(formData.get("code_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(codeId))
    redirect("/subscriptions?section=codes&error=invalid_code");
  const supabase = await verifiedAdminClient();
  const { error } = await supabase.rpc("admin_revoke_activation_code", {
    target_code_id: codeId,
  });
  redirect(
    error
      ? "/subscriptions?section=codes&error=revoke_failed"
      : "/subscriptions?section=codes&updated=revoked",
  );
}

export async function setSubscriptionSuspension(formData: FormData) {
  const subscriptionId = String(formData.get("subscription_id") ?? "");
  const suspend = String(formData.get("suspend") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();
  if (
    !/^[0-9a-f-]{36}$/i.test(subscriptionId) ||
    reason.length < 3 ||
    reason.length > 500
  ) {
    redirect("/subscriptions?section=subscriptions&error=invalid_suspension");
  }
  const supabase = await verifiedAdminClient();
  const { error } = await supabase.rpc("admin_set_subscription_suspension", {
    target_subscription_id: subscriptionId,
    suspend,
    reason,
  });
  redirect(
    error
      ? "/subscriptions?section=subscriptions&error=suspension_failed"
      : "/subscriptions?section=subscriptions&updated=subscription",
  );
}

function planKeyFromName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export async function saveSubscriptionPlan(formData: FormData) {
  const suppliedKey = String(formData.get("plan_key") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const rawPrice = String(formData.get("price_amount") ?? "").trim();
  const price = Number(rawPrice);
  const currency = String(formData.get("currency_code") ?? "")
    .trim()
    .toUpperCase();
  const rawDuration = String(formData.get("duration_value") ?? "").trim();
  const duration = Number(rawDuration);
  const durationUnit = String(formData.get("duration_unit") ?? "days") as
    "days" | "months";
  const displayOrder = Number(formData.get("display_order") ?? 0);
  const active = String(formData.get("is_active") ?? "") === "true";
  const badgeLabel = String(formData.get("badge_label") ?? "").trim();
  const benefits = String(formData.get("included_benefits") ?? "")
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
  const planKey =
    suppliedKey ||
    planKeyFromName(displayName) ||
    `plan-${crypto.randomUUID().slice(0, 8)}`;
  if (
    !/^[a-z0-9][a-z0-9_-]{2,63}$/.test(planKey) ||
    !displayName ||
    displayName.length > 120 ||
    !description ||
    description.length > 2000 ||
    !rawPrice ||
    !Number.isFinite(price) ||
    price < 0 ||
    !/^\p{Lu}{3}$/u.test(currency) ||
    !rawDuration ||
    !Number.isInteger(duration) ||
    duration < 1 ||
    duration > 120 ||
    !["days", "months"].includes(durationUnit) ||
    (durationUnit === "months" && duration * 30 > 3660) ||
    badgeLabel.length > 60 ||
    benefits.length > 20 ||
    benefits.some((value) => value.length > 160) ||
    !Number.isInteger(displayOrder) ||
    displayOrder < 0 ||
    displayOrder > 32767
  ) {
    redirect("/subscriptions/plans?error=invalid_plan");
  }
  const supabase = await verifiedAdminClient();
  const { error } = await supabase.rpc("admin_upsert_subscription_plan_v2", {
    target_plan_key: planKey,
    target_display_name: displayName,
    target_description: description,
    target_price_amount: price,
    target_currency_code: currency,
    target_duration_value: duration,
    target_duration_unit: durationUnit,
    target_display_order: displayOrder,
    target_is_active: active,
    target_included_benefits: benefits,
    target_badge_label: badgeLabel || null,
  });
  const migrationMissing =
    error?.code === "PGRST202" ||
    error?.code === "42883" ||
    /schema cache|could not find the function/i.test(error?.message ?? "");
  redirect(
    error
      ? `/subscriptions/plans?error=${migrationMissing ? "migration_missing" : "save_failed"}`
      : "/subscriptions/plans?updated=saved",
  );
}

export async function archiveSubscriptionPlan(formData: FormData) {
  const planKey = String(formData.get("plan_key") ?? "");
  if (!/^[a-z0-9][a-z0-9_-]{2,63}$/.test(planKey))
    redirect("/subscriptions/plans?error=invalid_plan");
  const supabase = await verifiedAdminClient();
  const { error } = await supabase.rpc("admin_archive_subscription_plan", {
    target_plan_key: planKey,
  });
  redirect(
    error
      ? "/subscriptions/plans?error=archive_failed"
      : "/subscriptions/plans?updated=archived",
  );
}

export async function saveManualPaymentMethod(formData: FormData) {
  const methodKey = String(formData.get("method_key") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  const instructions = String(
    formData.get("instructions_fr") ??
      formData.get("payment_instructions") ??
      "",
  ).trim();
  const instructionsAr = String(formData.get("instructions_ar") ?? "").trim();
  const details: Record<string, unknown> = {};
  for (const key of [
    "beneficiary_name",
    "account_number",
    "account_key",
    "receiving_identifier",
    "receiving_details",
    "bank_name",
    "rib",
    "iban",
    "swift_bic",
    "recipient_name",
    "contact_info",
    "location",
  ]) {
    const value = String(formData.get(key) ?? "").trim();
    if (value) details[key] = value;
  }
  const active = String(formData.get("is_active") ?? "") === "true";
  const displayOrder = Number(formData.get("display_order") ?? 0);
  if (
    !["ccp", "baridimob", "bank_transfer", "cash"].includes(methodKey) ||
    !displayName ||
    displayName.length > 80 ||
    instructions.length > 4000 ||
    instructionsAr.length > 4000 ||
    !Number.isInteger(displayOrder) ||
    displayOrder < 0 ||
    (active && !instructions)
  )
    redirect("/subscriptions/plans?error=invalid_method");
  const supabase = await verifiedAdminClient();
  const { error } = await supabase.rpc(
    "admin_update_manual_payment_method_v2",
    {
      target_method_key: methodKey,
      target_display_name: displayName,
      target_instructions_fr: instructions,
      target_instructions_ar: instructionsAr || null,
      target_details: details,
      target_is_active: active,
      target_display_order: displayOrder,
    },
  );
  redirect(
    error
      ? "/subscriptions/plans?error=save_failed"
      : "/subscriptions/plans?updated=saved",
  );
}

export async function confirmCashPayment(formData: FormData) {
  const subscriptionId = String(formData.get("subscription_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(subscriptionId) || note.length > 500) {
    redirect(
      "/subscriptions?section=subscriptions&error=cash_confirmation_failed",
    );
  }
  const supabase = await verifiedAdminClient();
  const { error } = await supabase.rpc("confirm_cash_payment", {
    target_subscription_id: subscriptionId,
    target_note: note || null,
  });
  redirect(
    error
      ? "/subscriptions?section=subscriptions&error=cash_confirmation_failed"
      : "/subscriptions?section=subscriptions&updated=cash_confirmed",
  );
}

export async function setSubscriptionPeriod(formData: FormData) {
  const subscriptionId = String(formData.get("subscription_id") ?? "");
  const starts = String(formData.get("starts_at_local") ?? "");
  const expires = String(formData.get("expires_at_local") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const localTimestamp = (value: string) =>
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
      ? `${value.replace("T", " ")}:00`
      : "";
  if (
    !/^[0-9a-f-]{36}$/i.test(subscriptionId) ||
    !localTimestamp(starts) ||
    !localTimestamp(expires) ||
    reason.length < 3 ||
    reason.length > 500
  ) {
    redirect("/subscriptions?section=subscriptions&error=invalid_period");
  }
  const supabase = await verifiedAdminClient();
  const { error } = await supabase.rpc("admin_set_subscription_period", {
    target_subscription_id: subscriptionId,
    target_starts_at_local: localTimestamp(starts),
    target_expires_at_local: localTimestamp(expires),
    target_reason: reason,
  });
  redirect(
    error
      ? "/subscriptions?section=subscriptions&error=period_failed"
      : "/subscriptions?section=subscriptions&updated=period",
  );
}

export type IssueCodeState = { code?: string; error?: string };

export async function issueActivationCode(
  _previous: IssueCodeState,
  formData: FormData,
): Promise<IssueCodeState> {
  const planKey = String(formData.get("plan_key") ?? "");
  const validFromInput = String(formData.get("valid_from") ?? "").trim();
  const validUntilInput = String(formData.get("valid_until") ?? "").trim();
  const usageLimit = Number(formData.get("usage_limit") ?? 1);
  const validFrom = validFromInput ? new Date(validFromInput) : new Date();
  const validUntil = validUntilInput ? new Date(validUntilInput) : null;
  if (
    !planKey ||
    usageLimit !== 1 ||
    Number.isNaN(validFrom.getTime()) ||
    (validUntil &&
      (Number.isNaN(validUntil.getTime()) || validUntil <= validFrom))
  ) {
    return { error: "invalid_policy" };
  }
  const supabase = await verifiedAdminClient();
  const { data, error } = await supabase.rpc("admin_issue_activation_code", {
    target_plan_key: planKey,
    target_valid_from: validFrom.toISOString(),
    target_valid_until: validUntil?.toISOString() ?? null,
    target_usage_limit: usageLimit,
  });
  if (error || !data?.[0]?.plaintext_code) {
    if (error?.code === "42501") return { error: "permission_denied" };
    const migrationMissing =
      error?.code === "PGRST202" ||
      error?.code === "42883" ||
      /schema cache|could not find the function/i.test(error?.message ?? "");
    return {
      error: migrationMissing ? "migration_missing" : "issuance_failed",
    };
  }
  return { code: data[0].plaintext_code };
}
