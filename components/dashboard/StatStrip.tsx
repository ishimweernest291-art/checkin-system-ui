"use client";

import type { ComponentType } from "react";
import { CheckCircle2, Clock, LogIn, LogOut, Users } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useFilters } from "./FilterProvider";
import { useSummary, usePreviousSummary, useTimeSeries } from "@/lib/use-stats";
import { comparisonLabel } from "@/lib/dashboard-filters";
import { fillSeries } from "@/lib/chart-buckets";
import { formatDuration, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCell {
  key: string;
  label: string;
  value: number | null | undefined;
  prev: number | null | undefined;
  format: (v: number | null | undefined) => string;
  sparkline?: boolean;
  positiveIsGood?: boolean;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}

function Delta({
  current,
  previous,
  positiveIsGood = true,
}: {
  current: number;
  previous: number;
  positiveIsGood?: boolean;
}) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) {
    return <span className="text-xs text-muted-foreground">flat</span>;
  }
  const up = pct > 0;
  const good = positiveIsGood ? up : !up;
  return (
    <span
      className={cn(
        "text-xs font-medium tabular-nums",
        good ? "text-emerald-600" : "text-red-600",
      )}
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

function Sparkline({ data }: { data: { bucket: string; count: number }[] }) {
  if (data.length < 2) return null;
  return (
    <ResponsiveContainer width="100%" height={28}>
      <AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Area
          type="monotone"
          dataKey="count"
          stroke="currentColor"
          fill="currentColor"
          fillOpacity={0.15}
          strokeWidth={1.5}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const ACCENTS = {
  accent: {
    card: "bg-accent/40 text-accent-foreground",
    circle: "bg-accent-foreground/10",
    badge: "bg-accent-foreground/10 text-accent-foreground",
  },
  success: {
    card: "bg-success/10 text-success",
    circle: "bg-success/15",
    badge: "bg-success/15 text-success",
  },
  info: {
    card: "bg-info/15 text-info-foreground",
    circle: "bg-info/20",
    badge: "bg-info/20 text-info-foreground",
  },
  warning: {
    card: "bg-warning/10 text-warning",
    circle: "bg-warning/15",
    badge: "bg-warning/15 text-warning",
  },
  neutral: {
    card: "bg-chart-5/10 text-foreground",
    circle: "bg-chart-5/15",
    badge: "bg-chart-5/15 text-foreground",
  },
} as const;

export function StatStrip() {
  const { committedFilters } = useFilters();
  const summary = useSummary(committedFilters);
  const previous = usePreviousSummary(committedFilters);
  const timeseries = useTimeSeries(committedFilters);
  const sparkData = fillSeries(
    timeseries.data,
    new Date(committedFilters.from),
    new Date(committedFilters.to),
    committedFilters.granularity,
    committedFilters,
  );

  const cells: StatCell[] = [
    {
      key: "total",
      label: "Total visits",
      value: summary.data?.total,
      prev: previous.data?.total,
      format: formatNumber,
      sparkline: true,
      icon: Users,
      accent: "accent",
    },
    {
      key: "checkedIn",
      label: "Checked in",
      value: summary.data?.checkedIn,
      prev: previous.data?.checkedIn,
      format: formatNumber,
      icon: LogIn,
      accent: "success",
    },
    {
      key: "checkedOut",
      label: "Checked out",
      value: summary.data?.checkedOut,
      prev: previous.data?.checkedOut,
      format: formatNumber,
      icon: LogOut,
      accent: "info",
    },
    {
      key: "rate",
      label: "Checkout completion",
      value: summary.data?.checkoutCompletionRate,
      prev: previous.data?.checkoutCompletionRate,
      format: formatPercent,
      icon: CheckCircle2,
      accent: "warning",
    },
    {
      key: "duration",
      label: "Avg duration",
      value: summary.data?.avgDurationMinutes,
      prev: previous.data?.avgDurationMinutes,
      format: formatDuration,
      positiveIsGood: false,
      icon: Clock,
      accent: "neutral",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-5">
      {cells.map((cell) => {
        const style = ACCENTS[cell.accent as keyof typeof ACCENTS];
        const Icon = cell.icon;
        return (
          <div
            key={cell.key}
            className={cn(
              "relative flex flex-col gap-2 overflow-hidden rounded-2xl p-4",
              style.card,
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute -top-6 -right-6 size-20 rounded-full blur-2xl",
                style.circle,
              )}
            />
            <div className="relative flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {cell.label}
              </p>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full",
                  style.badge,
                )}
              >
                <Icon className="size-3.5" />
              </span>
            </div>
            <p className="relative text-2xl font-semibold tabular-nums">
              {summary.isLoading ? "—" : cell.format(cell.value ?? null)}
            </p>
            <div className="relative flex h-4 items-center gap-1">
              {committedFilters.comparePrevious &&
                cell.value !== undefined &&
                cell.prev !== undefined &&
                cell.value !== null &&
                cell.prev !== null && (
                  <>
                    <Delta
                      current={cell.value}
                      previous={cell.prev}
                      positiveIsGood={cell.positiveIsGood ?? true}
                    />
                    <span className="text-xs text-muted-foreground">
                      {comparisonLabel(committedFilters.preset)}
                    </span>
                  </>
                )}
            </div>
            {cell.sparkline && timeseries.data && (
              <div className="relative">
                <Sparkline data={sparkData} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
