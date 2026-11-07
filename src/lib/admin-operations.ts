import "server-only";

import { assertAdminPrincipal } from "@/lib/auth/assert-admin";
import { resolveAdminPrincipal } from "@/lib/auth/resolve-admin-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type OperationsAuditItem = {
  id: string;
  action: string;
  actorUserId: string | null;
  professionalUserId: string | null;
  subscriptionId: string | null;
  activationCodeId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
};

export type OperationsOverviewResult =
  | {
      status: "success";
      checkedAt: string;
      bookingCounts: Record<string, number>;
      recentBookingEvents: Array<{
        id: string;
        eventType: string;
        toStatus: string;
        createdAt: string;
        bookingId: string;
      }>;
      pendingPaymentProofs: number;
      activeSubscriptions: number;
      recentAuditEvents: OperationsAuditItem[];
    }
  | { status: "denied" | "error"; checkedAt: string };

export type OperationsAuditResult =
  | {
      status: "success";
      checkedAt: string;
      items: OperationsAuditItem[];
      page: number;
      hasNextPage: boolean;
    }
  | { status: "denied" | "error"; checkedAt: string };

const AUDIT_PAGE_SIZE = 15;

const BOOKING_STATUSES = ["pending", "confirmed", "rejected", "cancelled"];

function normalizeAuditDetails(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export async function readOperationsOverview(): Promise<OperationsOverviewResult> {
  const principal = await resolveAdminPrincipal();
  let checkedAt = new Date().toISOString();
  if (!principal || !principal.roles.includes("admin")) {
    return { status: "denied", checkedAt };
  }

  assertAdminPrincipal(principal);

  try {
    const supabase = await createSupabaseServerClient();
    const [
      bookingCountsResult,
      bookingEventsResult,
      proofsResult,
      subscriptionsResult,
      auditResult,
    ] = await Promise.all([
      supabase.from("bookings").select("status", { count: "exact" }),
      supabase
        .from("booking_events")
        .select("id, booking_id, event_type, to_status, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("subscription_payment_proofs")
        .select("id", { count: "exact", head: true })
        .eq("review_status", "pending"),
      supabase
        .from("professional_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase.rpc("admin_list_subscription_audit"),
    ]);

    if (
      bookingCountsResult.error ||
      bookingEventsResult.error ||
      proofsResult.error ||
      subscriptionsResult.error ||
      auditResult.error
    ) {
      return { status: "error", checkedAt };
    }

    const bookingCounts = Object.fromEntries(
      BOOKING_STATUSES.map((status) => [status, 0]),
    ) as Record<string, number>;

    for (const row of bookingCountsResult.data ?? []) {
      const status = typeof row?.status === "string" ? row.status : null;
      if (status && status in bookingCounts) {
        bookingCounts[status] += 1;
      }
    }

    const recentBookingEvents = (bookingEventsResult.data ?? []).flatMap(
      (row) => {
        if (
          !row ||
          typeof row.id !== "string" ||
          typeof row.booking_id !== "string"
        ) {
          return [];
        }
        return [
          {
            id: row.id,
            eventType:
              typeof row.event_type === "string" ? row.event_type : "unknown",
            toStatus:
              typeof row.to_status === "string" ? row.to_status : "unknown",
            createdAt:
              typeof row.created_at === "string"
                ? row.created_at
                : new Date().toISOString(),
            bookingId: row.booking_id,
          },
        ];
      },
    );

    const recentAuditEvents = (
      (auditResult.data ?? []) as Array<Record<string, unknown>>
    ).flatMap((row) => {
      if (
        !row ||
        typeof row.id !== "string" ||
        typeof row.created_at !== "string"
      ) {
        return [];
      }
      return [
        {
          id: row.id,
          action: typeof row.action === "string" ? row.action : "unknown",
          actorUserId:
            typeof row.actor_user_id === "string" ? row.actor_user_id : null,
          professionalUserId:
            typeof row.professional_user_id === "string"
              ? row.professional_user_id
              : null,
          subscriptionId:
            typeof row.subscription_id === "string"
              ? row.subscription_id
              : null,
          activationCodeId:
            typeof row.activation_code_id === "string"
              ? row.activation_code_id
              : null,
          details: normalizeAuditDetails(row.details),
          createdAt: row.created_at,
        },
      ];
    });

    checkedAt = new Date().toISOString();
    return {
      status: "success",
      checkedAt,
      bookingCounts,
      recentBookingEvents,
      pendingPaymentProofs:
        typeof proofsResult.count === "number" ? proofsResult.count : 0,
      activeSubscriptions:
        typeof subscriptionsResult.count === "number"
          ? subscriptionsResult.count
          : 0,
      recentAuditEvents: recentAuditEvents.slice(0, 5),
    };
  } catch {
    return { status: "error", checkedAt };
  }
}

export async function readOperationsAuditLog(input: {
  q?: string;
  action?: string;
  page?: string;
}): Promise<OperationsAuditResult> {
  const principal = await resolveAdminPrincipal();
  let checkedAt = new Date().toISOString();
  if (!principal || !principal.roles.includes("admin")) {
    return { status: "denied", checkedAt };
  }

  assertAdminPrincipal(principal);

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("admin_list_subscription_audit");
    if (error || !data) {
      return { status: "error", checkedAt };
    }

    const query = (input.q ?? "").trim().toLowerCase();
    const actionFilter = input.action ?? "all";
    const pageValue = Number.parseInt(input.page ?? "1", 10);
    const page = Number.isFinite(pageValue) && pageValue > 0 ? pageValue : 1;

    const filtered = (data as Array<Record<string, unknown>>).filter((row) => {
      const action = typeof row.action === "string" ? row.action : "";
      const actorId =
        typeof row.actor_user_id === "string" ? row.actor_user_id : "";
      const professionalId =
        typeof row.professional_user_id === "string"
          ? row.professional_user_id
          : "";
      const subscriptionId =
        typeof row.subscription_id === "string" ? row.subscription_id : "";
      const activationCodeId =
        typeof row.activation_code_id === "string"
          ? row.activation_code_id
          : "";
      const detailsText = JSON.stringify(row.details ?? {}).toLowerCase();

      if (actionFilter !== "all" && action !== actionFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        action,
        actorId,
        professionalId,
        subscriptionId,
        activationCodeId,
        detailsText,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

    const pageSize = AUDIT_PAGE_SIZE;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end).map((row) => ({
      id: typeof row.id === "string" ? row.id : "",
      action: typeof row.action === "string" ? row.action : "unknown",
      actorUserId:
        typeof row.actor_user_id === "string" ? row.actor_user_id : null,
      professionalUserId:
        typeof row.professional_user_id === "string"
          ? row.professional_user_id
          : null,
      subscriptionId:
        typeof row.subscription_id === "string" ? row.subscription_id : null,
      activationCodeId:
        typeof row.activation_code_id === "string"
          ? row.activation_code_id
          : null,
      details: normalizeAuditDetails(row.details),
      createdAt:
        typeof row.created_at === "string"
          ? row.created_at
          : new Date().toISOString(),
    }));

    checkedAt = new Date().toISOString();
    return {
      status: "success",
      checkedAt,
      items,
      page,
      hasNextPage: end < filtered.length,
    };
  } catch {
    return { status: "error", checkedAt };
  }
}
