import type { FilterState } from "./dashboard-filters";
import type { Granularity, TimeSeriesPoint } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Ceiling on generated buckets, so a hand-edited URL can't ask for tens of thousands of bars. */
const MAX_BUCKETS = 2000;

export function spanDays(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / DAY_MS;
}

/** ISO weekday: 1 = Monday .. 7 = Sunday, matching the backend's `date_part('isodow')`. */
export function isoWeekday(date: Date): number {
  return ((date.getDay() + 6) % 7) + 1;
}

/** Bucket sizes that produce a readable chart for the given span. */
export function allowedGranularities(from: Date, to: Date): Granularity[] {
  const days = spanDays(from, to);
  const list: Granularity[] = [];
  if (days <= 7) list.push("HOUR");
  if (days <= 366) list.push("DAY");
  if (days >= 14) list.push("WEEK");
  if (days >= 60) list.push("MONTH");
  return list.length > 0 ? list : ["DAY"];
}

/**
 * Mirrors Postgres `date_trunc` in the browser's zone. API buckets are re-truncated
 * through this too, so both sides key on the same value even if the API server's
 * zone differs from the browser's.
 */
export function truncateToBucket(date: Date, granularity: Granularity): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  switch (granularity) {
    case "HOUR":
      return new Date(y, m, d, date.getHours());
    case "WEEK": {
      const start = new Date(y, m, d);
      start.setDate(start.getDate() - (isoWeekday(start) - 1));
      return start;
    }
    case "MONTH":
      return new Date(y, m, 1);
    case "DAY":
    default:
      return new Date(y, m, d);
  }
}

function advance(date: Date, granularity: Granularity): Date {
  const next = new Date(date);
  switch (granularity) {
    case "HOUR":
      next.setHours(next.getHours() + 1);
      break;
    case "WEEK":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTH":
      next.setMonth(next.getMonth() + 1);
      break;
    case "DAY":
    default:
      next.setDate(next.getDate() + 1);
      break;
  }
  return next;
}

/** True when the active weekday / hour-window filters exclude this bucket entirely. */
function isExcluded(
  bucket: Date,
  granularity: Granularity,
  filters: Pick<FilterState, "weekdays" | "hourStart" | "hourEnd">,
): boolean {
  const { weekdays, hourStart, hourEnd } = filters;
  if (granularity === "HOUR" || granularity === "DAY") {
    if (
      weekdays.length > 0 &&
      weekdays.length < 7 &&
      !weekdays.includes(isoWeekday(bucket))
    ) {
      return true;
    }
  }
  if (granularity === "HOUR") {
    const hour = bucket.getHours();
    if (hour < hourStart || hour > hourEnd) return true;
  }
  return false;
}

export function enumerateBuckets(
  from: Date,
  to: Date,
  granularity: Granularity,
  filters: Pick<FilterState, "weekdays" | "hourStart" | "hourEnd">,
): Date[] {
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return [];
  const buckets: Date[] = [];
  let cursor = truncateToBucket(from, granularity);
  while (cursor.getTime() <= to.getTime() && buckets.length < MAX_BUCKETS) {
    if (!isExcluded(cursor, granularity, filters)) buckets.push(cursor);
    cursor = advance(cursor, granularity);
  }
  return buckets;
}

/**
 * The API only returns buckets that contain visits, which silently drops quiet days
 * from the axis and misaligns the compare-previous overlay. This rebuilds the full
 * bucket list and merges the counts in.
 */
export function fillSeries(
  points: TimeSeriesPoint[] | undefined,
  from: Date,
  to: Date,
  granularity: Granularity,
  filters: Pick<FilterState, "weekdays" | "hourStart" | "hourEnd">,
): TimeSeriesPoint[] {
  const skeleton = enumerateBuckets(from, to, granularity, filters);
  if (skeleton.length === 0) return points ?? [];
  const counts = new Map<number, number>();
  for (const point of points ?? []) {
    const key = truncateToBucket(new Date(point.bucket), granularity).getTime();
    counts.set(key, (counts.get(key) ?? 0) + point.count);
  }
  return skeleton.map((bucket) => ({
    bucket: bucket.toISOString(),
    count: counts.get(bucket.getTime()) ?? 0,
  }));
}

export type HeatmapMode = "HOURS" | "WEEKDAY_HOUR" | "CALENDAR";

/**
 * Chosen from the real span rather than from `granularity`, which the user can override:
 * a single day collapses the weekday axis, and a quarter or more is better read as a calendar.
 */
export function heatmapMode(from: Date, to: Date): HeatmapMode {
  const days = spanDays(from, to);
  if (days <= 2) return "HOURS";
  if (days <= 92) return "WEEKDAY_HOUR";
  return "CALENDAR";
}
