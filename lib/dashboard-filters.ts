import type { Granularity } from "./types";

export type Preset =
  | "TODAY"
  | "YESTERDAY"
  | "7D"
  | "30D"
  | "MONTH"
  | "QUARTER"
  | "YEAR"
  | "CUSTOM";

/** Preset names written by earlier builds; still accepted from URLs and saved views. */
export type LegacyPreset = "MTD" | "QTD" | "YTD";

/** Presets that resolve against a `period` anchor rather than against "now". */
export type PeriodPreset = "MONTH" | "QUARTER" | "YEAR";

export type Density = "comfortable" | "compact";

/** Quick presets rendered as segments; MONTH/QUARTER/YEAR get their own pickers, CUSTOM has no control. */
export const PRESETS: { value: Preset; label: string }[] = [
  { value: "TODAY", label: "Today" },
  { value: "YESTERDAY", label: "Yesterday" },
  { value: "7D", label: "Last 7 days" },
  { value: "30D", label: "Last 30 days" },
];

export const PRESET_URL_VALUES: (Preset | LegacyPreset)[] = [
  "TODAY",
  "YESTERDAY",
  "7D",
  "30D",
  "MONTH",
  "QUARTER",
  "YEAR",
  "CUSTOM",
  "MTD",
  "QTD",
  "YTD",
];

export const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export const WEEKDAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** All filter fields shared across the whole dashboard, persisted to the URL by FilterProvider. */
export interface FilterState {
  preset: Preset;
  /** Anchor for period presets: "2026-08" (month), "2026-Q3" (quarter), "2026" (year). */
  period: string;
  from: string;
  to: string;
  granularity: Granularity;
  hourStart: number;
  hourEnd: number;
  weekdays: number[];
  branchId: string;
  entranceId: string;
  purpose: string;
  status: string;
  search: string;
  comparePrevious: boolean;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

const LEGACY_PRESETS: Record<LegacyPreset, PeriodPreset> = {
  MTD: "MONTH",
  QTD: "QUARTER",
  YTD: "YEAR",
};

export function isPeriodPreset(preset: Preset): preset is PeriodPreset {
  return preset === "MONTH" || preset === "QUARTER" || preset === "YEAR";
}

export function normalizePreset(value: string | undefined): Preset {
  if (!value) return DEFAULT_FILTER_STATE.preset;
  if (value in LEGACY_PRESETS) return LEGACY_PRESETS[value as LegacyPreset];
  return PRESET_URL_VALUES.includes(value as Preset)
    ? (value as Preset)
    : DEFAULT_FILTER_STATE.preset;
}

function quarterOf(month: number): number {
  return Math.floor(month / 3) + 1;
}

export function monthToken(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export function quarterToken(year: number, quarter: number): string {
  return `${year}-Q${quarter}`;
}

/** The anchor token for the period containing `now`, used when a period preset has no explicit anchor. */
export function currentPeriodToken(
  preset: PeriodPreset,
  now = new Date(),
): string {
  if (preset === "MONTH") return monthToken(now.getFullYear(), now.getMonth());
  if (preset === "QUARTER") {
    return quarterToken(now.getFullYear(), quarterOf(now.getMonth()));
  }
  return String(now.getFullYear());
}

interface ParsedPeriod {
  year: number;
  /** Zero-based first month of the period. */
  startMonth: number;
  monthSpan: number;
}

function parsePeriod(
  preset: PeriodPreset,
  period: string,
  now: Date,
): ParsedPeriod {
  if (preset === "MONTH") {
    const match = /^(\d{4})-(\d{2})$/.exec(period);
    const month = match ? Number(match[2]) - 1 : now.getMonth();
    const year = match ? Number(match[1]) : now.getFullYear();
    const valid = month >= 0 && month <= 11;
    return {
      year: valid ? year : now.getFullYear(),
      startMonth: valid ? month : now.getMonth(),
      monthSpan: 1,
    };
  }
  if (preset === "QUARTER") {
    const match = /^(\d{4})-Q([1-4])$/.exec(period);
    const year = match ? Number(match[1]) : now.getFullYear();
    const quarter = match ? Number(match[2]) : quarterOf(now.getMonth());
    return { year, startMonth: (quarter - 1) * 3, monthSpan: 3 };
  }
  const match = /^(\d{4})$/.exec(period);
  return {
    year: match ? Number(match[1]) : now.getFullYear(),
    startMonth: 0,
    monthSpan: 12,
  };
}

/** Resolves a preset (plus its period anchor) into a concrete [from, to] range. */
export function presetToRange(
  preset: Preset,
  now = new Date(),
  period = "",
): { from: Date; to: Date } {
  switch (preset) {
    case "TODAY":
      return { from: startOfDay(now), to: now };
    case "YESTERDAY": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }
    case "7D": {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { from: startOfDay(from), to: now };
    }
    case "30D": {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { from: startOfDay(from), to: now };
    }
    case "MONTH":
    case "QUARTER":
    case "YEAR": {
      const { year, startMonth, monthSpan } = parsePeriod(preset, period, now);
      const from = new Date(year, startMonth, 1);
      // A period still in progress ends at "now", so charts don't trail off into empty future buckets.
      const end = endOfDay(new Date(year, startMonth + monthSpan, 0));
      return { from, to: end > now ? now : end };
    }
    case "CUSTOM":
    default:
      return { from: startOfDay(now), to: now };
  }
}

/** Human label for the selected period, e.g. "August 2026", "Q3 2026", "2026". */
export function periodLabel(
  preset: Preset,
  period: string,
  now = new Date(),
): string {
  if (!isPeriodPreset(preset)) return "";
  const { year, startMonth } = parsePeriod(preset, period, now);
  if (preset === "MONTH") {
    return new Date(year, startMonth, 1).toLocaleDateString(undefined, {
      month: "long",
      year: "numeric",
    });
  }
  if (preset === "QUARTER") return `Q${quarterOf(startMonth)} ${year}`;
  return String(year);
}

/** Label for the whole active range, shown as a caption under the preset controls. */
export function rangeLabel(state: FilterState): string {
  if (isPeriodPreset(state.preset)) {
    return periodLabel(state.preset, state.period);
  }
  const preset = PRESETS.find((p) => p.value === state.preset);
  if (preset) return preset.label;
  return formatRange(new Date(state.from), new Date(state.to));
}

export function formatRange(from: Date, to: Date): string {
  const sameYear = from.getFullYear() === to.getFullYear();
  const start = from.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const end = to.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return start === end ? end : `${start} – ${end}`;
}

/** Names what the "compare to previous period" overlay is measured against. */
export function comparisonLabel(preset: Preset): string {
  switch (preset) {
    case "TODAY":
      return "vs yesterday";
    case "YESTERDAY":
      return "vs previous day";
    case "7D":
      return "vs previous 7 days";
    case "30D":
      return "vs previous 30 days";
    case "MONTH":
      return "vs previous month";
    case "QUARTER":
      return "vs previous quarter";
    case "YEAR":
      return "vs previous year";
    default:
      return "vs previous period";
  }
}

export function monthOptions(
  now = new Date(),
  count = 24,
): { value: string; label: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: monthToken(date.getFullYear(), date.getMonth()),
      label: date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    };
  });
}

export function quarterOptions(
  now = new Date(),
  count = 8,
): { value: string; label: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
    const quarter = quarterOf(date.getMonth());
    return {
      value: quarterToken(date.getFullYear(), quarter),
      label: `Q${quarter} ${date.getFullYear()}`,
    };
  });
}

export function yearOptions(
  now = new Date(),
  count = 5,
): { value: string; label: string }[] {
  return Array.from({ length: count }, (_, i) => {
    const year = now.getFullYear() - i;
    return { value: String(year), label: String(year) };
  });
}

/** Suggests a bucket resolution from the span of the range (user can still override). */
export function suggestGranularity(from: Date, to: Date): Granularity {
  const days = (to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000);
  if (days <= 1.5) return "HOUR";
  if (days <= 62) return "DAY";
  if (days <= 180) return "WEEK";
  return "MONTH";
}

/** The equal-length period immediately preceding [from, to], for the "compare" overlay. */
export function previousEqualRange(
  from: Date,
  to: Date,
): { from: Date; to: Date } {
  const span = to.getTime() - from.getTime();
  return {
    from: new Date(from.getTime() - span),
    to: new Date(from.getTime() - 1),
  };
}

/** Shared query-param builder consumed by every stats/visits fetch. */
export function filterStateToParams(state: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.from) params.set("from", state.from);
  if (state.to) params.set("to", state.to);
  if (state.branchId) params.set("branchId", state.branchId);
  if (state.entranceId) params.set("entranceId", state.entranceId);
  if (state.purpose) params.set("purpose", state.purpose);
  if (state.status) params.set("status", state.status);
  if (state.search) params.set("q", state.search);
  if (state.weekdays.length > 0 && state.weekdays.length < 7) {
    params.set("weekdays", state.weekdays.join(","));
  }
  if (state.hourStart > 0) params.set("hourStart", String(state.hourStart));
  if (state.hourEnd < 23) params.set("hourEnd", String(state.hourEnd));
  return params;
}

export function activeFilterCount(state: FilterState): number {
  let count = 0;
  if (state.branchId) count++;
  if (state.entranceId) count++;
  if (state.purpose) count++;
  if (state.status) count++;
  if (state.search) count++;
  if (state.weekdays.length > 0 && state.weekdays.length < 7) count++;
  if (state.hourStart > 0 || state.hourEnd < 23) count++;
  if (state.preset !== "30D") count++;
  return count;
}

// from/to are intentionally left blank: baking a `new Date()`-derived value in here
// would freeze "now" to whenever this module was first loaded (SSR vs client, or a
// long-lived server process) instead of the actual current time. FilterProvider
// resolves the real range for the "30D" preset fresh on every render instead.
export const DEFAULT_FILTER_STATE: FilterState = {
  preset: "30D",
  period: "",
  from: "",
  to: "",
  granularity: "DAY",
  hourStart: 0,
  hourEnd: 23,
  weekdays: [],
  branchId: "",
  entranceId: "",
  purpose: "",
  status: "",
  search: "",
  comparePrevious: false,
};

/** Repairs states persisted before MTD/QTD/YTD became MONTH/QUARTER/YEAR with an explicit anchor. */
export function normalizeFilterState(state: FilterState): FilterState {
  const preset = normalizePreset(state.preset);
  const period =
    state.period || (isPeriodPreset(preset) ? currentPeriodToken(preset) : "");
  if (preset === state.preset && period === state.period) return state;
  const { from, to } = presetToRange(preset, new Date(), period);
  return {
    ...state,
    preset,
    period,
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
