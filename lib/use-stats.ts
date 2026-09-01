"use client";

import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "./api-admin";
import {
  filterStateToParams,
  previousEqualRange,
  type FilterState,
} from "./dashboard-filters";
import type {
  BranchStat,
  EntranceStat,
  HeatmapCell,
  PurposeStat,
  SummaryStats,
  TimeSeriesPoint,
} from "./types";

function previousRangeParams(filters: FilterState): URLSearchParams {
  const { from, to } = previousEqualRange(
    new Date(filters.from),
    new Date(filters.to),
  );
  return filterStateToParams({
    ...filters,
    from: from.toISOString(),
    to: to.toISOString(),
  });
}

export function useSummary(filters: FilterState) {
  const params = filterStateToParams(filters);
  return useQuery({
    queryKey: ["stats", "summary", params.toString()],
    queryFn: () => adminFetch<SummaryStats>(`/admin/stats/summary?${params}`),
  });
}

export function usePreviousSummary(filters: FilterState) {
  const params = previousRangeParams(filters);
  return useQuery({
    queryKey: ["stats", "summary", "previous", params.toString()],
    queryFn: () => adminFetch<SummaryStats>(`/admin/stats/summary?${params}`),
    enabled: filters.comparePrevious,
  });
}

export function useTimeSeries(filters: FilterState) {
  const params = filterStateToParams(filters);
  params.set("granularity", filters.granularity);
  return useQuery({
    queryKey: ["stats", "timeseries", params.toString()],
    queryFn: () =>
      adminFetch<TimeSeriesPoint[]>(`/admin/stats/timeseries?${params}`),
  });
}

export function usePreviousTimeSeries(filters: FilterState) {
  const params = previousRangeParams(filters);
  params.set("granularity", filters.granularity);
  return useQuery({
    queryKey: ["stats", "timeseries", "previous", params.toString()],
    queryFn: () =>
      adminFetch<TimeSeriesPoint[]>(`/admin/stats/timeseries?${params}`),
    enabled: filters.comparePrevious,
  });
}

export function useHeatmap(filters: FilterState, enabled = true) {
  const params = filterStateToParams(filters);
  return useQuery({
    queryKey: ["stats", "heatmap", params.toString()],
    queryFn: () => adminFetch<HeatmapCell[]>(`/admin/stats/heatmap?${params}`),
    enabled,
  });
}

/** Day buckets regardless of the user's chosen granularity, for the calendar heatmap. */
export function useDailySeries(filters: FilterState, enabled: boolean) {
  const params = filterStateToParams(filters);
  params.set("granularity", "DAY");
  return useQuery({
    queryKey: ["stats", "timeseries", "daily", params.toString()],
    queryFn: () =>
      adminFetch<TimeSeriesPoint[]>(`/admin/stats/timeseries?${params}`),
    enabled,
  });
}

export function useByPurpose(filters: FilterState) {
  const params = filterStateToParams(filters);
  return useQuery({
    queryKey: ["stats", "by-purpose", params.toString()],
    queryFn: () =>
      adminFetch<PurposeStat[]>(`/admin/stats/by-purpose?${params}`),
  });
}

export function useByBranch(filters: FilterState, enabled: boolean) {
  const params = filterStateToParams(filters);
  return useQuery({
    queryKey: ["stats", "by-branch", params.toString()],
    queryFn: () => adminFetch<BranchStat[]>(`/admin/stats/by-branch?${params}`),
    enabled,
  });
}

export function useByEntrance(filters: FilterState) {
  const params = filterStateToParams(filters);
  return useQuery({
    queryKey: ["stats", "by-entrance", params.toString()],
    queryFn: () =>
      adminFetch<EntranceStat[]>(`/admin/stats/by-entrance?${params}`),
  });
}
