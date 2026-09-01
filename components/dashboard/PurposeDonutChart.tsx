"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PURPOSE_STYLES } from "@/lib/badge-styles";
import { formatNumber, formatPercent } from "@/lib/format";
import type { PurposeStat } from "@/lib/types";

/** Fixed hue per purpose, independent of API order, so a purpose always renders the same slice color. */
const PURPOSE_COLORS: Record<string, string> = {
  MEETING: "var(--chart-1)",
  DELIVERY: "var(--chart-3)",
  INTERVIEW: "var(--chart-4)",
  OTHER: "var(--chart-5)",
};

export function PurposeDonutChart({
  rows,
  isLoading,
  subtitle,
}: {
  rows: PurposeStat[];
  isLoading?: boolean;
  subtitle?: string;
}) {
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const data = [...rows]
    .sort((a, b) => b.count - a.count)
    .map((r) => ({
      key: r.purpose,
      label: PURPOSE_STYLES[r.purpose].label,
      count: r.count,
    }));

  return (
    <Card flat className="bg-muted/40">
      <CardContent>
        <div className="mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Visits by purpose
          </h2>
          {subtitle && (
            <p
              className="text-xs text-muted-foreground/80"
              suppressHydrationWarning
            >
              {subtitle}
            </p>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-65 w-full" />
        ) : data.length === 0 ? (
          <p className="flex h-65 items-center justify-center text-sm text-muted-foreground">
            No data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
                isAnimationActive={false}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={PURPOSE_COLORS[entry.key] ?? "var(--chart-5)"}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => {
                  const count = Number(value);
                  return [
                    `${formatNumber(count)} · ${formatPercent(total > 0 ? count / total : 0)}`,
                    name,
                  ];
                }}
                contentStyle={{
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: 12,
                  color: "var(--muted-foreground)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
