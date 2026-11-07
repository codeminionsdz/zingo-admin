import "server-only";

import type { Database } from "@/lib/shared/database";
import { assertAdminPrincipal } from "@/lib/auth/assert-admin";
import { resolveAdminPrincipal } from "@/lib/auth/resolve-admin-principal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  formatAdminDateTime,
  parseBookingSearchInput,
  parseCustomerSearchInput,
  parseSavedBookingServices,
  type BookingSearchInput,
  type SavedBookingService,
} from "@/lib/support-lookup-input";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CustomerSearchRow =
  Database["public"]["Functions"]["admin_search_customers"]["Returns"][number];
type BookingSearchRow =
  Database["public"]["Functions"]["admin_search_bookings"]["Returns"][number];

export type CustomerListItem = {
  id: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  registeredAt: string;
  wilayaCode: number | null;
  communeCode: number | null;
};

export type CustomerSearchResult =
  | {
      status: "success";
      items: CustomerListItem[];
      hasNextPage: boolean;
      page: number;
      checkedAt: string;
    }
  | { status: "denied" | "error"; checkedAt: string };

export type CustomerBookingPreview = {
  id: string;
  status: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
  totalDzd: number;
  services: SavedBookingService[];
};

export type CustomerDetail = {
  displayName: string | null;
  email: string | null;
  phone: string | null;
  registeredAt: string;
  wilayaCode: number | null;
  communeCode: number | null;
  bookings: CustomerBookingPreview[];
  hasMoreBookings: boolean;
};

export type CustomerDetailResult =
  | { status: "success"; customer: CustomerDetail; checkedAt: string }
  | { status: "not_found" | "denied" | "error"; checkedAt: string };

export type BookingListItem = {
  id: string;
  status: string;
  customerName: string | null;
  professionalName: string | null;
  establishmentName: string | null;
  startAt: string;
  endAt: string;
  serviceNames: string[];
  totalDzd: number;
  createdAt: string;
  updatedAt: string;
};

export type BookingSearchResult =
  | {
      status: "success";
      items: BookingListItem[];
      hasNextPage: boolean;
      page: number;
      checkedAt: string;
    }
  | { status: "denied" | "error"; checkedAt: string };

export type BookingEvent = {
  eventType: string;
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
  actorName: string | null;
};

export type BookingDetail = {
  id: string;
  status: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  professionalName: string | null;
  establishmentName: string | null;
  startAt: string;
  endAt: string;
  totalDzd: number;
  legacyDurationMinutes: number | null;
  createdAt: string;
  updatedAt: string;
  decidedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  services: SavedBookingService[];
  publishedSlot: { date: string; localStartTime: string } | null;
  events: BookingEvent[];
};

export type BookingDetailResult =
  | { status: "success"; booking: BookingDetail; checkedAt: string }
  | { status: "not_found" | "denied" | "error"; checkedAt: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function nullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseCustomerSearchRow(row: CustomerSearchRow): CustomerListItem {
  return {
    id: row.user_id,
    displayName: row.display_name,
    email: row.email,
    phone: row.phone,
    registeredAt: row.registered_at,
    wilayaCode: row.wilaya_code,
    communeCode: row.commune_code,
  };
}

function parseCustomerDetail(value: unknown): CustomerDetail | null {
  if (!isRecord(value) || !isRecord(value.customer)) return null;
  const customer = value.customer;
  if (typeof customer.registeredAt !== "string") return null;
  const bookings = Array.isArray(value.bookings)
    ? value.bookings.flatMap((item) => {
        if (!isRecord(item)) return [];
        if (
          typeof item.bookingId !== "string" ||
          typeof item.status !== "string" ||
          typeof item.startAt !== "string" ||
          typeof item.endAt !== "string" ||
          typeof item.createdAt !== "string" ||
          typeof item.updatedAt !== "string" ||
          typeof item.totalDzd !== "number"
        ) {
          return [];
        }
        return [
          {
            id: item.bookingId,
            status: item.status,
            startAt: item.startAt,
            endAt: item.endAt,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            totalDzd: item.totalDzd,
            services: parseSavedBookingServices(item.services),
          },
        ];
      })
    : [];
  return {
    displayName: nullableString(customer.displayName),
    email: nullableString(customer.email),
    phone: nullableString(customer.phone),
    registeredAt: customer.registeredAt,
    wilayaCode: nullableNumber(customer.wilayaCode),
    communeCode: nullableNumber(customer.communeCode),
    bookings,
    hasMoreBookings: value.hasMoreBookings === true,
  };
}

function parseBookingSearchRow(row: BookingSearchRow): BookingListItem {
  return {
    id: row.booking_id,
    status: row.status,
    customerName: row.customer_name,
    professionalName: row.professional_name,
    establishmentName: row.establishment_name,
    startAt: row.start_at,
    endAt: row.end_at,
    serviceNames: row.service_names,
    totalDzd: row.total_dzd,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseBookingDetail(value: unknown): BookingDetail | null {
  if (!isRecord(value) || !isRecord(value.booking)) return null;
  const booking = value.booking;
  if (
    typeof booking.id !== "string" ||
    typeof booking.status !== "string" ||
    typeof booking.startAt !== "string" ||
    typeof booking.endAt !== "string" ||
    typeof booking.totalDzd !== "number" ||
    typeof booking.createdAt !== "string" ||
    typeof booking.updatedAt !== "string"
  ) {
    return null;
  }

  const publishedSlot =
    isRecord(value.publishedSlot) &&
    typeof value.publishedSlot.date === "string" &&
    typeof value.publishedSlot.localStartTime === "string"
      ? {
          date: value.publishedSlot.date,
          localStartTime: value.publishedSlot.localStartTime,
        }
      : null;
  const events = Array.isArray(value.events)
    ? value.events.flatMap((item) => {
        if (
          !isRecord(item) ||
          typeof item.eventType !== "string" ||
          typeof item.toStatus !== "string" ||
          typeof item.createdAt !== "string"
        ) {
          return [];
        }
        return [
          {
            eventType: item.eventType,
            fromStatus: nullableString(item.fromStatus),
            toStatus: item.toStatus,
            createdAt: item.createdAt,
            actorName: nullableString(item.actorName),
          },
        ];
      })
    : [];

  return {
    id: booking.id,
    status: booking.status,
    customerName: nullableString(booking.customerName),
    customerEmail: nullableString(booking.customerEmail),
    customerPhone: nullableString(booking.customerPhone),
    professionalName: nullableString(booking.professionalName),
    establishmentName: nullableString(booking.establishmentName),
    startAt: booking.startAt,
    endAt: booking.endAt,
    totalDzd: booking.totalDzd,
    legacyDurationMinutes: nullableNumber(booking.legacyDurationMinutes),
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    decidedAt: nullableString(booking.decidedAt),
    cancelledAt: nullableString(booking.cancelledAt),
    cancellationReason: nullableString(booking.cancellationReason),
    services: parseSavedBookingServices(value.services),
    publishedSlot,
    events,
  };
}

function accessStatus(error: { code?: string } | null) {
  return error?.code === "42501" ? "denied" : "error";
}

export async function readCustomerSearch(input: {
  query?: string;
  page?: string;
}): Promise<CustomerSearchResult> {
  let checkedAt = new Date().toISOString();
  const principal = await resolveAdminPrincipal();
  if (!principal || !principal.roles.includes("admin")) {
    return { status: "denied", checkedAt };
  }
  assertAdminPrincipal(principal);

  const parsed = parseCustomerSearchInput(input.query, input.page);
  if (!parsed.valid) return { status: "error", checkedAt };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("admin_search_customers", {
      target_query: parsed.query,
      target_page: parsed.page,
    });
    if (error || !data) {
      return { status: accessStatus(error), checkedAt };
    }

    checkedAt = new Date().toISOString();
    return {
      status: "success",
      items: data.map(parseCustomerSearchRow),
      hasNextPage: data[0]?.has_next_page ?? false,
      page: parsed.page,
      checkedAt,
    };
  } catch {
    return { status: "error", checkedAt };
  }
}

export async function readCustomerDetail(
  customerId: string,
): Promise<CustomerDetailResult> {
  let checkedAt = new Date().toISOString();
  const principal = await resolveAdminPrincipal();
  if (!principal || !principal.roles.includes("admin")) {
    return { status: "denied", checkedAt };
  }
  assertAdminPrincipal(principal);
  if (!uuidPattern.test(customerId)) return { status: "not_found", checkedAt };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("admin_get_customer_details", {
      target_user_id: customerId,
    });
    if (error) return { status: accessStatus(error), checkedAt };
    if (!data) return { status: "not_found", checkedAt };
    const customer = parseCustomerDetail(data);
    if (!customer) return { status: "error", checkedAt };
    checkedAt = new Date().toISOString();
    return { status: "success", customer, checkedAt };
  } catch {
    return { status: "error", checkedAt };
  }
}

export async function readBookingSearch(
  input: BookingSearchInput,
): Promise<BookingSearchResult> {
  let checkedAt = new Date().toISOString();
  const principal = await resolveAdminPrincipal();
  if (!principal || !principal.roles.includes("admin")) {
    return { status: "denied", checkedAt };
  }
  assertAdminPrincipal(principal);

  const parsed = parseBookingSearchInput({
    query: input.query,
    status: input.status,
    from: input.from,
    until: input.until,
    page: String(input.page),
  });
  if (!parsed.valid) return { status: "error", checkedAt };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("admin_search_bookings", {
      target_query: parsed.value.query || null,
      target_status: parsed.value.status === "all" ? null : parsed.value.status,
      target_from: parsed.value.from || null,
      target_until: parsed.value.until || null,
      target_page: parsed.value.page,
    });
    if (error || !data) {
      return { status: accessStatus(error), checkedAt };
    }

    checkedAt = new Date().toISOString();
    return {
      status: "success",
      items: data.map(parseBookingSearchRow),
      hasNextPage: data[0]?.has_next_page ?? false,
      page: parsed.value.page,
      checkedAt,
    };
  } catch {
    return { status: "error", checkedAt };
  }
}

export async function readBookingDetail(
  bookingId: string,
): Promise<BookingDetailResult> {
  let checkedAt = new Date().toISOString();
  const principal = await resolveAdminPrincipal();
  if (!principal || !principal.roles.includes("admin")) {
    return { status: "denied", checkedAt };
  }
  assertAdminPrincipal(principal);
  if (!uuidPattern.test(bookingId)) return { status: "not_found", checkedAt };

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("admin_get_booking_details", {
      target_booking_id: bookingId,
    });
    if (error) return { status: accessStatus(error), checkedAt };
    if (!data) return { status: "not_found", checkedAt };
    const booking = parseBookingDetail(data);
    if (!booking) return { status: "error", checkedAt };
    checkedAt = new Date().toISOString();
    return { status: "success", booking, checkedAt };
  } catch {
    return { status: "error", checkedAt };
  }
}

export function formatBookingTimeRange(
  startAt: string,
  endAt: string,
  locale: "fr" | "ar",
) {
  return `${formatAdminDateTime(startAt, locale)} – ${formatAdminDateTime(endAt, locale)}`;
}
