"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { StatStrip } from "@/components/dashboard/StatStrip";
import { TimeSeriesChart } from "@/components/dashboard/TimeSeriesChart";
import { HeatmapGrid } from "@/components/dashboard/HeatmapGrid";
import { PurposeDonutChart } from "@/components/dashboard/PurposeDonutChart";
import { BranchBarChart } from "@/components/dashboard/BranchBarChart";
import { EntranceTreemap } from "@/components/dashboard/EntranceTreemap";
import { VisitsTable } from "@/components/dashboard/VisitsTable";
import { useFilters } from "@/components/dashboard/FilterProvider";
import { useByBranch, useByEntrance, useByPurpose } from "@/lib/use-stats";
import { filterStateToParams, rangeLabel } from "@/lib/dashboard-filters";
import { useSession } from "@/lib/use-session";
import { useQuery } from "@tanstack/react-query";
import { adminFetch } from "@/lib/api-admin";
import type { Page as ApiPage, Visit } from "@/lib/types";

export default function DashboardOverviewPage() {
  const { data: session } = useSession();
  const { committedFilters } = useFilters();

  const byPurpose = useByPurpose(committedFilters);
  const byBranch = useByBranch(committedFilters, session?.role === "MANAGER");
  const byEntrance = useByEntrance(committedFilters);

  const recentParams = (() => {
    const p = filterStateToParams(committedFilters);
    p.set("page", "0");
    p.set("size", "10");
    p.set("sort", "checkInTime,desc");
    return p;
  })();

  const recent = useQuery({
    queryKey: ["visits", "recent", recentParams.toString()],
    queryFn: () => adminFetch<ApiPage<Visit>>(`/admin/visits?${recentParams}`),
  });

  const viewAllParams = filterStateToParams(committedFilters).toString();
  const periodLabel = rangeLabel(committedFilters);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Overview</h1>
      </div>

      <FilterBar />

      <StatStrip />

      <TimeSeriesChart />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HeatmapGrid />
        <PurposeDonutChart
          isLoading={byPurpose.isLoading}
          rows={byPurpose.data ?? []}
          subtitle={periodLabel}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {session?.role === "MANAGER" && (
          <BranchBarChart
            isLoading={byBranch.isLoading}
            rows={byBranch.data ?? []}
            subtitle={periodLabel}
          />
        )}
        <EntranceTreemap
          isLoading={byEntrance.isLoading}
          rows={byEntrance.data ?? []}
          subtitle={periodLabel}
        />
      </div>

      <Card flat className="overflow-x-auto p-0">
        <CardContent className="flex items-center justify-between border-b border-border py-3!">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent activity
          </h2>
          <Link
            href={`/dashboard/visits?${viewAllParams}`}
            className="text-sm text-primary hover:underline"
            suppressHydrationWarning
          >
            View all
          </Link>
        </CardContent>
        <VisitsTable
          visits={recent.data?.content ?? []}
          isLoading={recent.isLoading}
        />
      </Card>
    </div>
  );
}
