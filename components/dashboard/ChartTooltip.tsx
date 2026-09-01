"use client";

import type { TooltipContentProps } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { formatNumber } from "@/lib/format";

export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
}: TooltipContentProps<ValueType, NameType> & {
  labelFormatter?: (label: string | number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs">
      <p className="mb-1 font-medium text-foreground">
        {labelFormatter && label !== undefined ? labelFormatter(label) : label}
      </p>
      <div className="flex flex-col gap-0.5">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey)}
            className="flex items-center gap-2 tabular-nums"
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {typeof entry.value === "number"
                ? formatNumber(entry.value)
                : String(entry.value ?? "—")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
