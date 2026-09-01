"use client";

import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/format";
import type { EntranceStat } from "@/lib/types";

const TILE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

interface TreemapTileProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  value?: number;
}

function TreemapTile({
  x,
  y,
  width,
  height,
  index,
  name,
  value,
}: TreemapTileProps) {
  if (x === undefined || y === undefined || !width || !height) return null;
  const showLabel = width > 56 && height > 32;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={TILE_COLORS[(index ?? 0) % TILE_COLORS.length]}
        stroke="var(--muted)"
        strokeWidth={2}
      />
      {showLabel && (
        <text
          x={x + 8}
          y={y + 18}
          fontSize={12}
          fontWeight={500}
          fill="var(--background)"
        >
          {name}
        </text>
      )}
      {showLabel && (
        <text
          x={x + 8}
          y={y + 34}
          fontSize={11}
          fill="var(--background)"
          opacity={0.85}
        >
          {formatNumber(value)}
        </text>
      )}
    </g>
  );
}

/**
 * Recharts keys treemap nodes by name, but entrances in different branches can share one
 * (`/admin/stats/by-entrance` returns every branch's entrances when no branch is selected).
 */
function toTiles(rows: EntranceStat[]): { name: string; value: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.entranceName, (totals.get(row.entranceName) ?? 0) + 1);
  }
  const used = new Map<string, number>();
  const tiles: { name: string; value: number }[] = [];
  for (const row of rows) {
    const occurrence = (used.get(row.entranceName) ?? 0) + 1;
    used.set(row.entranceName, occurrence);
    tiles.push({
      name:
        (totals.get(row.entranceName) ?? 0) > 1
          ? `${row.entranceName} (${occurrence})`
          : row.entranceName,
      value: row.count,
    });
  }
  return tiles;
}

export function EntranceTreemap({
  rows,
  isLoading,
  subtitle,
}: {
  rows: EntranceStat[];
  isLoading?: boolean;
  subtitle?: string;
}) {
  const data = toTiles([...rows].sort((a, b) => b.count - a.count));

  return (
    <Card flat className="bg-muted/40">
      <CardContent>
        <div className="mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Visits by entrance
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
            <Treemap
              data={data}
              dataKey="value"
              nameKey="name"
              stroke="var(--muted)"
              content={<TreemapTile />}
              isAnimationActive={false}
            >
              <Tooltip
                formatter={(value) => formatNumber(Number(value))}
                contentStyle={{
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
