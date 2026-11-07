"use server";

import { revalidatePath } from "next/cache";
import { assertAdminPrincipal } from "@/lib/auth/assert-admin";
import { resolveAdminPrincipal } from "@/lib/auth/resolve-admin-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RecipientFilter = {
  audience: "professional" | "customer";
  status: string | null;
  wilaya: number | null;
};

async function requireAdmin() {
  const principal = await resolveAdminPrincipal();
  assertAdminPrincipal(principal);
  return createSupabaseServerClient();
}

export async function searchCommunicationRecipients(
  input: RecipientFilter & { query: string; page: number },
) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.rpc(
    "admin_search_communication_recipients",
    {
      target_audience: input.audience,
      target_query: input.query || null,
      target_status: input.status,
      target_wilaya: input.wilaya,
      target_page: input.page,
    },
  );
  return { recipients: error ? [] : (data ?? []), failed: Boolean(error) };
}

export async function countCommunicationRecipients(
  input: RecipientFilter & { userIds: string[] | null },
) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.rpc(
    "admin_count_communication_recipients",
    {
      target_audience: input.audience,
      target_status: input.status,
      target_wilaya: input.wilaya,
      target_user_ids: input.userIds,
    },
  );
  return { count: error ? 0 : (data ?? 0), failed: Boolean(error) };
}

export async function sendCommunication(input: {
  requestKey: string;
  messageType: "operational" | "announcement";
  audience: "professional" | "customer";
  mode: "all" | "selected";
  status: string | null;
  wilaya: number | null;
  userIds: string[];
  language: "ar" | "fr";
  title: string;
  body: string;
  destination: string | null;
  expectedCount: number;
}) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.rpc("admin_send_communication", {
    target_request_key: input.requestKey,
    target_message_type: input.messageType,
    target_audience: input.audience,
    target_mode: input.mode,
    target_status: input.status,
    target_wilaya: input.wilaya,
    target_user_ids: input.mode === "selected" ? input.userIds : [],
    target_language: input.language,
    target_title: input.title,
    target_body: input.body,
    target_destination: input.destination,
    target_expected_count: input.expectedCount,
  });
  if (error || !data?.[0]) {
    const message = error?.message;
    return {
      messageId: null,
      stalePreview:
        message === "communication_recipient_count_changed" ||
        message === "communication_recipient_selection_changed",
      error: true,
    };
  }
  revalidatePath("/communications");
  return { messageId: data[0].message_id, error: false, stalePreview: false };
}
