export type DateRangeValue = "7days" | "30days" | "90days" | "year";
export type NetworkValue = "all" | "mainnet" | "testnet";
export type StatusValue = "all" | "success" | "partial" | "failed";

export interface HistoryFilterValues {
  search: string;
  dateRange: DateRangeValue;
  network: NetworkValue;
  status: StatusValue;
}

export const DEFAULT_HISTORY_FILTERS: HistoryFilterValues = {
  search: "",
  dateRange: "7days",
  network: "all",
  status: "all",
};

const DATE_RANGE_DAYS: Record<DateRangeValue, number> = {
  "7days": 7,
  "30days": 30,
  "90days": 90,
  year: 365,
};

const DATE_RANGE_VALUES = new Set<DateRangeValue>(["7days", "30days", "90days", "year"]);
const NETWORK_VALUES = new Set<NetworkValue>(["all", "mainnet", "testnet"]);
const STATUS_VALUES = new Set<StatusValue>(["all", "success", "partial", "failed"]);

interface SearchParamLike {
  get(name: string): string | null;
}

function pickValue<T extends string>(
  value: string | null,
  allowed: Set<T>,
  fallback: T,
): T {
  return value && allowed.has(value as T) ? (value as T) : fallback;
}

/** Convert a preset date-range filter into an ISO `from` timestamp for createdAt. */
export function dateRangeToFrom(dateRange: DateRangeValue): string {
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - DATE_RANGE_DAYS[dateRange]);
  return from.toISOString();
}

/** Parse dashboard history filters from the URL query string. */
export function parseHistoryFilters(searchParams?: SearchParamLike | null): HistoryFilterValues {
  if (!searchParams) {
    return DEFAULT_HISTORY_FILTERS;
  }

  const search = searchParams.get("search")?.trim() ?? "";

  return {
    search,
    dateRange: pickValue(searchParams.get("dateRange"), DATE_RANGE_VALUES, DEFAULT_HISTORY_FILTERS.dateRange),
    network: pickValue(searchParams.get("network"), NETWORK_VALUES, DEFAULT_HISTORY_FILTERS.network),
    status: pickValue(searchParams.get("status"), STATUS_VALUES, DEFAULT_HISTORY_FILTERS.status),
  };
}

/** Escape `%` and `_` so user input is treated literally in SQL LIKE patterns. */
export function escapeLikePattern(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
