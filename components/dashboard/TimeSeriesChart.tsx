"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartTooltip } from "./ChartTooltip";
import { useFilters } from "./FilterProvider";
import { useTimeSeries, usePreviousTimeSeries } from "@/lib/use-stats";
import {
  allowedGranularities,
  fillSeries,
  spanDays,
} from "@/lib/chart-buckets";
import { previousEqualRange, rangeLabel } from "@/lib/dashboard-filters";
import { cn } from "@/lib/utils";
import type { Granularity } from "@/lib/types";

const GRANULARITY_LABELS: Record<Granularity, string> = {
  HOUR: "Hour",
  DAY: "Day",
  WEEK: "Week",
  MONTH: "Month",
};

function bucketLabel(
  bucket: string,
  granularity: Granularity,
  multiDay: boolean,
): string {
  const date = new Date(bucket);
  if (granularity === "HOUR") {
    const hour = date.toLocaleTimeString([], { hour: "2-digit" });
    return multiDay
      ? `${date.toLocaleDateString([], { month: "short", day: "numeric" })} ${hour}`
      : hour;
  }
  if (granularity === "MONTH") {
    return date.toLocaleDateString([], { month: "short", year: "2-digit" });
  }
  if (granularity === "WEEK") {
    return `Wk of ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function TimeSeriesChart() {
  const { committedFilters, filters, setFilters } = useFilters();
  const series = useTimeSeries(committedFilters);
  const previousSeries = usePreviousTimeSeries(committedFilters);

  const from = new Date(committedFilters.from);
  const to = new Date(committedFilters.to);
  const multiDay = spanDays(from, to) > 1;
  const granularities = allowedGranularities(
    new Date(filters.from),
    new Date(filters.to),
  );

  const data = useMemo(() => {
    const { granularity } = committedFilters;
    const base = fillSeries(
      series.data,
      from,
      to,
      granularity,
      committedFilters,
    );
    if (!committedFilters.comparePrevious || !previousSeries.data) {
      return base;
    }
    // Both series are filled onto their own skeletons first, so the overlay lines up
    // bucket-for-bucket instead of by raw array index.
    const prevRange = previousEqualRange(from, to);
    const previous = fillSeries(
      previousSeries.data,
      prevRange.from,
      prevRange.to,
      granularity,
      committedFilters,
    );
    return base.map((point, index) => ({
      ...point,
      previous: previous[index]?.count ?? 0,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series.data, previousSeries.data, committedFilters]);

  return (
    <Card flat className="bg-muted/40">
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">
              Visits over time
            </h2>
            <p
              className="text-xs text-muted-foreground/80"
              suppressHydrationWarning
            >
              {rangeLabel(committedFilters)}
            </p>
          </div>
          <div className="inline-flex divide-x divide-border overflow-hidden rounded-lg border border-border">
            {(Object.keys(GRANULARITY_LABELS) as Granularity[]).map((g) => {
              const disabled = !granularities.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  disabled={disabled}
                  onClick={() => setFilters({ granularity: g })}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium transition-colors",
                    filters.granularity === g
                      ? "bg-foreground text-background"
                      : "bg-background text-muted-foreground hover:text-foreground",
                    disabled &&
                      "cursor-not-allowed opacity-40 hover:text-muted-foreground",
                  )}
                >
                  {GRANULARITY_LABELS[g]}
                </button>
              );
            })}
          </div>
        </div>
        {series.isLoading ? (
          <Skeleton className="h-65 w-full" />
        ) : data.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} barGap={2}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tickFormatter={(b) =>
                    bucketLabel(b, committedFilters.granularity, multiDay)
                  }
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={16}
                />
                <YAxis
                  allowDecimals={false}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={(props) => (
                    <ChartTooltip
                      {...props}
                      labelFormatter={(b) =>
                        bucketLabel(
                          String(b),
                          committedFilters.granularity,
                          multiDay,
                        )
                      }
                    />
                  )}
                />
                {committedFilters.comparePrevious && (
                  <Bar
                    dataKey="previous"
                    name="Previous period"
                    fill="var(--muted-foreground)"
                    fillOpacity={0.35}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                )}
                <Bar
                  dataKey="count"
                  name="Visits"
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <p className="flex h-65 items-center justify-center text-sm text-muted-foreground">
            No visits in this range.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
