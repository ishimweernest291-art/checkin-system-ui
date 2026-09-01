"use client";

import { Fragment, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilters } from "./FilterProvider";
import { useDailySeries, useHeatmap } from "@/lib/use-stats";
import { WEEKDAY_LABELS, rangeLabel } from "@/lib/dashboard-filters";
import {
  enumerateBuckets,
  heatmapMode,
  isoWeekday,
  truncateToBucket,
} from "@/lib/chart-buckets";
import { formatNumber } from "@/lib/format";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const UNFILTERED = { weekdays: [] as number[], hourStart: 0, hourEnd: 23 };
const EXCLUDED_TITLE = "Excluded by filters";

function intensity(count: number, max: number): number {
  if (count === 0) return 0.04;
  return Math.max(max > 0 ? count / max : 0, 0.12);
}

function Legend() {
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <span>Less</span>
      {[0.12, 0.34, 0.56, 0.78, 1].map((opacity) => (
        <span
          key={opacity}
          className="size-2.5 rounded-xs bg-foreground"
          style={{ opacity }}
        />
      ))}
      <span>More</span>
    </div>
  );
}

interface DayCell {
  date: Date;
  count: number;
  excluded: boolean;
}

export function HeatmapGrid() {
  const { committedFilters } = useFilters();
  const from = new Date(committedFilters.from);
  const to = new Date(committedFilters.to);
  const mode = heatmapMode(from, to);

  const heatmap = useHeatmap(committedFilters, mode !== "CALENDAR");
  const daily = useDailySeries(committedFilters, mode === "CALENDAR");

  const activeWeekdays =
    committedFilters.weekdays.length === 0
      ? [1, 2, 3, 4, 5, 6, 7]
      : committedFilters.weekdays;

  const { grid, max, hourTotals, hourMax } = useMemo(() => {
    const map = new Map<string, number>();
    const hours = new Map<number, number>();
    let maxCount = 0;
    let hourMaxCount = 0;
    for (const cell of heatmap.data ?? []) {
      map.set(`${cell.weekday}-${cell.hour}`, cell.count);
      if (cell.count > maxCount) maxCount = cell.count;
      const hourTotal = (hours.get(cell.hour) ?? 0) + cell.count;
      hours.set(cell.hour, hourTotal);
      if (hourTotal > hourMaxCount) hourMaxCount = hourTotal;
    }
    return {
      grid: map,
      max: maxCount,
      hourTotals: hours,
      hourMax: hourMaxCount,
    };
  }, [heatmap.data]);

  // Quarter/year ranges are read as a calendar of days rather than a 7x24 average,
  // which would otherwise flatten away any seasonality.
  const calendar = useMemo(() => {
    if (mode !== "CALENDAR") return null;
    const days = enumerateBuckets(from, to, "DAY", UNFILTERED);
    if (days.length === 0) return null;
    const counts = new Map<number, number>();
    for (const point of daily.data ?? []) {
      const key = truncateToBucket(new Date(point.bucket), "DAY").getTime();
      counts.set(key, (counts.get(key) ?? 0) + point.count);
    }
    const cells: DayCell[] = days.map((date) => ({
      date,
      count: counts.get(date.getTime()) ?? 0,
      excluded: !activeWeekdays.includes(isoWeekday(date)),
    }));
    const maxCount = cells.reduce((acc, cell) => Math.max(acc, cell.count), 0);

    const columns: (DayCell | null)[][] = [];
    let column: (DayCell | null)[] = Array(isoWeekday(cells[0].date) - 1).fill(
      null,
    );
    for (const cell of cells) {
      column.push(cell);
      if (column.length === 7) {
        columns.push(column);
        column = [];
      }
    }
    if (column.length > 0) {
      while (column.length < 7) column.push(null);
      columns.push(column);
    }

    let lastMonth = -1;
    const monthLabels = columns.map((col) => {
      const first = col.find((c): c is DayCell => c !== null);
      if (!first || first.date.getMonth() === lastMonth) return "";
      lastMonth = first.date.getMonth();
      return first.date.toLocaleDateString([], { month: "short" });
    });

    return { columns, monthLabels, max: maxCount };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, daily.data, committedFilters]);

  const isLoading = mode === "CALENDAR" ? daily.isLoading : heatmap.isLoading;

  return (
    <Card flat className="bg-muted/40">
      <CardContent>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">
              Activity heatmap
            </h2>
            <p
              className="text-xs text-muted-foreground/80"
              suppressHydrationWarning
            >
              {rangeLabel(committedFilters)}
            </p>
          </div>
          <Legend />
        </div>
        {isLoading ? (
          <Skeleton className="h-65 w-full" />
        ) : mode === "HOURS" ? (
          <div className="grid grid-cols-24 gap-0.5">
            {HOURS.map((h) => {
              const count = hourTotals.get(h) ?? 0;
              const excluded =
                h < committedFilters.hourStart || h > committedFilters.hourEnd;
              return (
                <div key={h} className="flex flex-col items-center gap-1">
                  {excluded ? (
                    <div
                      title={EXCLUDED_TITLE}
                      className="aspect-square w-full rounded-[3px] border border-dashed border-border"
                    />
                  ) : (
                    <div
                      title={`${h}:00 — ${formatNumber(count)} visits`}
                      className="aspect-square w-full rounded-[3px] bg-foreground"
                      style={{ opacity: intensity(count, hourMax) }}
                    />
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {h % 3 === 0 ? h : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ) : mode === "WEEKDAY_HOUR" ? (
          <div className="grid grid-cols-[2rem_repeat(24,minmax(0,1fr))] gap-0.5">
            <div />
            {HOURS.map((h) => (
              <div
                key={h}
                className="text-center text-[10px] text-muted-foreground"
              >
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
            {WEEKDAY_LABELS.map((label, index) => {
              const day = index + 1;
              const dayExcluded = !activeWeekdays.includes(day);
              return (
                <Fragment key={day}>
                  <div className="flex items-center pr-2 text-xs text-muted-foreground">
                    {label}
                  </div>
                  {HOURS.map((h) => {
                    const excluded =
                      dayExcluded ||
                      h < committedFilters.hourStart ||
                      h > committedFilters.hourEnd;
                    if (excluded) {
                      return (
                        <div
                          key={`${day}-${h}`}
                          title={EXCLUDED_TITLE}
                          className="aspect-square rounded-[3px] border border-dashed border-border"
                        />
                      );
                    }
                    const count = grid.get(`${day}-${h}`) ?? 0;
                    return (
                      <div
                        key={`${day}-${h}`}
                        title={`${label} ${h}:00 — ${formatNumber(count)} visits`}
                        className="aspect-square rounded-[3px] bg-foreground"
                        style={{ opacity: intensity(count, max) }}
                      />
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
        ) : calendar ? (
          <div className="overflow-x-auto">
            <div className="flex gap-2">
              <div className="flex shrink-0 flex-col gap-0.5 pt-4.5 text-[10px] text-muted-foreground">
                {WEEKDAY_LABELS.map((label, index) => (
                  <span key={index} className="flex h-3 items-center">
                    {index % 2 === 0 ? label : ""}
                  </span>
                ))}
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex h-4 gap-0.5">
                  {calendar.monthLabels.map((label, index) => (
                    <span
                      key={index}
                      className="w-3 shrink-0 text-[10px] whitespace-nowrap text-muted-foreground"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="flex gap-0.5">
                  {calendar.columns.map((column, columnIndex) => (
                    <div
                      key={columnIndex}
                      className="flex shrink-0 flex-col gap-0.5"
                    >
                      {column.map((cell, dayIndex) => {
                        if (!cell) {
                          return <span key={dayIndex} className="size-3" />;
                        }
                        if (cell.excluded) {
                          return (
                            <span
                              key={dayIndex}
                              title={EXCLUDED_TITLE}
                              className="size-3 rounded-xs border border-dashed border-border"
                            />
                          );
                        }
                        return (
                          <span
                            key={dayIndex}
                            title={`${cell.date.toLocaleDateString()} — ${formatNumber(cell.count)} visits`}
                            className="size-3 rounded-xs bg-foreground"
                            style={{
                              opacity: intensity(cell.count, calendar.max),
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="flex h-65 items-center justify-center text-sm text-muted-foreground">
            No visits in this range.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
