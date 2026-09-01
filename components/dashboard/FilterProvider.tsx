"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import {
  DEFAULT_FILTER_STATE,
  PRESET_URL_VALUES,
  currentPeriodToken,
  isPeriodPreset,
  normalizePreset,
  presetToRange,
  suggestGranularity,
  type FilterState,
  type LegacyPreset,
  type Preset,
} from "@/lib/dashboard-filters";
import { allowedGranularities } from "@/lib/chart-buckets";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { Granularity } from "@/lib/types";

const GRANULARITY_VALUES: Granularity[] = ["HOUR", "DAY", "WEEK", "MONTH"];

const filterParsers = {
  preset: parseAsStringEnum<Preset | LegacyPreset>(
    PRESET_URL_VALUES,
  ).withDefault(DEFAULT_FILTER_STATE.preset),
  period: parseAsString.withDefault(DEFAULT_FILTER_STATE.period),
  from: parseAsString.withDefault(DEFAULT_FILTER_STATE.from),
  to: parseAsString.withDefault(DEFAULT_FILTER_STATE.to),
  granularity: parseAsStringEnum<Granularity>(GRANULARITY_VALUES).withDefault(
    DEFAULT_FILTER_STATE.granularity,
  ),
  hourStart: parseAsInteger.withDefault(DEFAULT_FILTER_STATE.hourStart),
  hourEnd: parseAsInteger.withDefault(DEFAULT_FILTER_STATE.hourEnd),
  weekdays: parseAsArrayOf(parseAsInteger).withDefault(
    DEFAULT_FILTER_STATE.weekdays,
  ),
  branchId: parseAsString.withDefault(DEFAULT_FILTER_STATE.branchId),
  entranceId: parseAsString.withDefault(DEFAULT_FILTER_STATE.entranceId),
  purpose: parseAsString.withDefault(DEFAULT_FILTER_STATE.purpose),
  status: parseAsString.withDefault(DEFAULT_FILTER_STATE.status),
  search: parseAsString.withDefault(DEFAULT_FILTER_STATE.search),
  comparePrevious: parseAsBoolean.withDefault(
    DEFAULT_FILTER_STATE.comparePrevious,
  ),
};

interface FilterContextValue {
  /** Reflects the URL immediately; drives all form controls. */
  filters: FilterState;
  /** Debounced ~300ms; drives data fetching so typing/dragging doesn't spam the API. */
  committedFilters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  applyPreset: (preset: Preset, period?: string) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

/** Keeps a URL-supplied bucket size from producing an unreadable (or enormous) chart. */
function clampGranularity(
  granularity: Granularity,
  from: Date,
  to: Date,
): Granularity {
  return allowedGranularities(from, to).includes(granularity)
    ? granularity
    : suggestGranularity(from, to);
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useQueryStates(filterParsers, {
    history: "replace",
    clearOnDefault: true,
  });

  // Resolving the range here (rather than baking it into DEFAULT_FILTER_STATE) keeps "now"
  // honest: a module-level value would freeze for the lifetime of the server process.
  const filters = useMemo<FilterState>(() => {
    const preset = normalizePreset(state.preset);
    const period =
      state.period ||
      (isPeriodPreset(preset) ? currentPeriodToken(preset) : "");
    const needsRange =
      preset !== state.preset ||
      period !== state.period ||
      !state.from ||
      !state.to;
    const resolved =
      preset === "CUSTOM" && state.from && state.to
        ? { from: new Date(state.from), to: new Date(state.to) }
        : needsRange
          ? presetToRange(preset, new Date(), period)
          : { from: new Date(state.from), to: new Date(state.to) };
    return {
      ...state,
      preset,
      period,
      from: resolved.from.toISOString(),
      to: resolved.to.toISOString(),
      granularity: clampGranularity(
        state.granularity,
        resolved.from,
        resolved.to,
      ),
    };
  }, [state]);
  const committedFilters = useDebouncedValue(filters, 300);

  const value = useMemo<FilterContextValue>(
    () => ({
      filters,
      committedFilters,
      setFilters: (patch) => {
        void setState(patch);
      },
      applyPreset: (preset, period) => {
        if (preset === "CUSTOM") {
          void setState({ preset });
          return;
        }
        const nextPeriod =
          period ?? (isPeriodPreset(preset) ? currentPeriodToken(preset) : "");
        const { from, to } = presetToRange(preset, new Date(), nextPeriod);
        void setState({
          preset,
          period: nextPeriod,
          from: from.toISOString(),
          to: to.toISOString(),
          granularity: suggestGranularity(from, to),
        });
      },
      resetFilters: () => {
        void setState(null);
      },
    }),
    [filters, committedFilters, setState],
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return ctx;
}
