"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PURPOSE_STYLES, STATUS_STYLES } from "@/lib/badge-styles";
import { durationMinutesBetween, formatDuration, initials } from "@/lib/format";
import { LiveDuration } from "./LiveDuration";
import type { Visit } from "@/lib/types";
import { cn } from "@/lib/utils";

export type Density = "comfortable" | "compact";

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function SortableHeader({
  label,
  field,
  sort,
  onSort,
}: {
  label: string;
  field: string;
  sort?: string;
  onSort?: (field: string) => void;
}) {
  if (!onSort) return <span>{label}</span>;
  const [currentField, dir] = (sort ?? "").split(",");
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="inline-flex items-center gap-1 hover:text-foreground"
    >
      {label}
      <ArrowUpDown
        className={cn("size-3", currentField === field && "text-foreground")}
      />
      {currentField === field && (
        <span className="text-[10px] text-muted-foreground">
          {dir === "asc" ? "↑" : "↓"}
        </span>
      )}
    </button>
  );
}

export function VisitsTable({
  visits,
  isLoading,
  density = "comfortable",
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onRowClick,
  onSort,
  sort,
  emptyMessage = "No visits found.",
}: {
  visits: Visit[];
  isLoading?: boolean;
  density?: Density;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onRowClick?: (visit: Visit) => void;
  onSort?: (field: string) => void;
  sort?: string;
  emptyMessage?: React.ReactNode;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const maxDuration = useMemo(() => {
    let max = 0;
    for (const v of visits) {
      const minutes =
        v.status === "CHECKED_IN"
          ? (now - new Date(v.checkInTime).getTime()) / 60_000
          : durationMinutesBetween(v.checkInTime, v.checkOutTime);
      if (minutes && minutes > max) max = minutes;
    }
    return max;
  }, [visits, now]);

  const cellPad = density === "compact" ? "py-1.5" : "py-3";
  const allSelected =
    selectable &&
    visits.length > 0 &&
    visits.every((v) => selectedIds?.has(v.id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead className={cellPad}>
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => onToggleSelectAll?.()}
              />
            </TableHead>
          )}
          <TableHead className={cellPad}>
            <SortableHeader
              label="Visitor"
              field="fullName"
              sort={sort}
              onSort={onSort}
            />
          </TableHead>
          <TableHead className={cellPad}>Purpose</TableHead>
          <TableHead className={cellPad}>Host</TableHead>
          <TableHead className={cellPad}>Branch / Entrance</TableHead>
          <TableHead className={cellPad}>
            <SortableHeader
              label="Check-in"
              field="checkInTime"
              sort={sort}
              onSort={onSort}
            />
          </TableHead>
          <TableHead className={cellPad}>Duration</TableHead>
          <TableHead className={cellPad}>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: selectable ? 8 : 7 }).map((__, j) => (
                <TableCell key={j} className={cellPad}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : visits.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={selectable ? 8 : 7}
              className="py-10 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          visits.map((visit) => {
            const minutes =
              visit.status === "CHECKED_IN"
                ? (now - new Date(visit.checkInTime).getTime()) / 60_000
                : durationMinutesBetween(visit.checkInTime, visit.checkOutTime);
            const barWidth =
              maxDuration > 0 && minutes
                ? Math.min(100, (minutes / maxDuration) * 100)
                : 0;

            return (
              <TableRow
                key={visit.id}
                className={cn(
                  "cursor-pointer hover:bg-muted",
                  selectedIds?.has(visit.id) && "bg-muted",
                )}
                onClick={() => onRowClick?.(visit)}
              >
                {selectable && (
                  <TableCell
                    className={cellPad}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds?.has(visit.id) ?? false}
                      onCheckedChange={() => onToggleSelect?.(visit.id)}
                    />
                  </TableCell>
                )}
                <TableCell className={cellPad}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {initials(visit.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {visit.fullName}
                        {visit.priorVisitCount > 0 && (
                          <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            ×{visit.priorVisitCount + 1}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {visit.phone}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className={cellPad}>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                      PURPOSE_STYLES[visit.purpose].className,
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        PURPOSE_STYLES[visit.purpose].dot,
                      )}
                    />
                    {PURPOSE_STYLES[visit.purpose].label}
                  </span>
                </TableCell>
                <TableCell className={cn(cellPad, "text-muted-foreground")}>
                  {visit.hostName}
                </TableCell>
                <TableCell className={cn(cellPad, "text-muted-foreground")}>
                  {visit.branchName} · {visit.entranceName}
                </TableCell>
                <TableCell
                  className={cn(cellPad, "tabular-nums text-muted-foreground")}
                >
                  {formatDateTime(visit.checkInTime)}
                </TableCell>
                <TableCell className={cellPad}>
                  <div className="flex flex-col gap-1">
                    <span className="tabular-nums text-xs">
                      {visit.status === "CHECKED_IN" ? (
                        <LiveDuration checkInTime={visit.checkInTime} />
                      ) : (
                        formatDuration(minutes)
                      )}
                    </span>
                    <div className="h-1 w-16 overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-foreground/60"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className={cellPad}>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLES[visit.status].className,
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        STATUS_STYLES[visit.status].dot,
                      )}
                    />
                    {STATUS_STYLES[visit.status].label}
                  </span>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
