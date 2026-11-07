export const SUPPORT_LOOKUP_PAGE_SIZE = 25;
export const SUPPORT_LOOKUP_MAX_PAGE = 1000;
export const MAX_SUPPORT_QUERY_LENGTH = 80;
export const MAX_BOOKING_DATE_RANGE_DAYS = 365;

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "completed",
] as const;

export type BookingStatusFilter = (typeof BOOKING_STATUSES)[number] | "all";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneSearchPattern = /^[+0-9() .-]+$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export type CustomerSearchInputResult =
  | { valid: true; query: string; page: number }
  | { valid: false; reason: "query" | "page" };

export type BookingSearchInput = {
  query: string;
  status: BookingStatusFilter;
  from: string;
  until: string;
  page: number;
};

export type BookingSearchInputResult =
  | { valid: true; value: BookingSearchInput }
  | {
      valid: false;
      reason: "query" | "status" | "date" | "range" | "criteria" | "page";
    };

function parsePage(value: string | undefined) {
  if (value === undefined || value === "") return 1;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;
  return Math.min(parsed, SUPPORT_LOOKUP_MAX_PAGE);
}

function isValidDate(value: string) {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isValidSupportQuery(value: string) {
  if (
    value.length < 2 ||
    value.length > MAX_SUPPORT_QUERY_LENGTH ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return false;
  }
  if (value.includes("@")) return emailPattern.test(value);
  if (phoneSearchPattern.test(value) && value.replace(/\D/g, "").length >= 4) {
    return true;
  }
  return true;
}

export function parseCustomerSearchInput(
  query: string | undefined,
  page: string | undefined,
): CustomerSearchInputResult {
  const normalizedQuery = (query ?? "").trim();
  const parsedPage = parsePage(page);
  if (!isValidSupportQuery(normalizedQuery)) {
    return { valid: false, reason: "query" };
  }
  if (parsedPage === null) return { valid: false, reason: "page" };
  return { valid: true, query: normalizedQuery, page: parsedPage };
}

export function parseBookingSearchInput(input: {
  query?: string;
  status?: string;
  from?: string;
  until?: string;
  page?: string;
}): BookingSearchInputResult {
  const query = (input.query ?? "").trim();
  const from = (input.from ?? "").trim();
  const until = (input.until ?? "").trim();
  const status = input.status ?? "all";
  const page = parsePage(input.page);

  if (page === null) return { valid: false, reason: "page" };
  if (status !== "all" && !BOOKING_STATUSES.some((value) => value === status)) {
    return { valid: false, reason: "status" };
  }
  if (query && !isValidSupportQuery(query)) {
    return { valid: false, reason: "query" };
  }

  const hasFrom = from !== "";
  const hasUntil = until !== "";
  if (hasFrom !== hasUntil) return { valid: false, reason: "date" };
  if (hasFrom && (!isValidDate(from) || !isValidDate(until))) {
    return { valid: false, reason: "date" };
  }
  if (hasFrom) {
    const rangeDays =
      (Date.parse(`${until}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000;
    if (rangeDays < 0 || rangeDays > MAX_BOOKING_DATE_RANGE_DAYS) {
      return { valid: false, reason: "range" };
    }
  }
  if (!query && !hasFrom) return { valid: false, reason: "criteria" };

  return {
    valid: true,
    value: { query, status: status as BookingStatusFilter, from, until, page },
  };
}

export function formatAdminDateTime(
  value: string,
  locale: "fr" | "ar",
): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
    dateStyle: "medium",
    hour12: false,
    timeStyle: "short",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export function formatAdminDate(value: string, locale: "fr" | "ar"): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-DZ" : "fr-DZ", {
    dateStyle: "medium",
    timeZone: "Africa/Algiers",
  }).format(new Date(value));
}

export function formatBookingTimeRange(
  startAt: string,
  endAt: string,
  locale: "fr" | "ar",
) {
  return `${formatAdminDateTime(startAt, locale)} – ${formatAdminDateTime(endAt, locale)}`;
}

export type SavedBookingService = {
  name: string;
  priceDzd: number;
  durationMinutes: number | null;
  order: number;
};

export function parseSavedBookingServices(
  value: unknown,
): SavedBookingService[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const service = item as Record<string, unknown>;
    if (
      typeof service.name !== "string" ||
      typeof service.priceDzd !== "number" ||
      !Number.isInteger(service.priceDzd)
    ) {
      return [];
    }
    return [
      {
        name: service.name,
        priceDzd: service.priceDzd,
        durationMinutes:
          typeof service.durationMinutes === "number" &&
          Number.isInteger(service.durationMinutes)
            ? service.durationMinutes
            : null,
        order:
          typeof service.order === "number" && Number.isInteger(service.order)
            ? service.order
            : 0,
      },
    ];
  });
}
