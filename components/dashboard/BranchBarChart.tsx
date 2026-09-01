"use client";

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
import { formatNumber } from "@/lib/format";
import type { BranchStat } from "@/lib/types";

export function BranchBarChart({
  rows,
  isLoading,
  subtitle,
}: {
  rows: BranchStat[];
  isLoading?: boolean;
  subtitle?: string;
}) {
  const data = [...rows]
    .sort((a, b) => a.count - b.count)
    .map((r) => ({ label: r.branchName, count: r.count }));
  const height = Math.max(180, data.length * 36);

  return (
    <Card flat className="bg-muted/40">
      <CardContent>
        <div className="mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Visits by branch
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
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={110}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={(props) => (
                  <ChartTooltip {...props} labelFormatter={(l) => String(l)} />
                )}
                formatter={(value) => formatNumber(Number(value))}
              />
              <Bar
                dataKey="count"
                name="Visits"
                fill="var(--chart-2)"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
