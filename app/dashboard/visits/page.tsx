"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, LayoutList, Rows3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { useFilters } from "@/components/dashboard/FilterProvider";
import { VisitsTable, type Density } from "@/components/dashboard/VisitsTable";
import { VisitDrawer } from "@/components/dashboard/VisitDrawer";
import { adminFetch } from "@/lib/api-admin";
import {
  activeFilterCount,
  filterStateToParams,
} from "@/lib/dashboard-filters";
import type { BulkCheckOutResponse, Page as ApiPage, Visit } from "@/lib/types";

const DENSITY_KEY = "checkin:visits-density";
const PAGE_SIZE = 20;
const UNDO_WINDOW_MS = 5000;

export default function VisitsPage() {
  const queryClient = useQueryClient();
  const { filters, setFilters, committedFilters, resetFilters } = useFilters();

  const [page, setPage] = useState(0);
  const [sort, setSort] = useState("checkInTime,desc");
  const [density, setDensity] = useState<Density>(() => {
    if (typeof window === "undefined") return "comfortable";
    const stored = window.localStorage.getItem(DENSITY_KEY);
    return stored === "compact" ? "compact" : "comfortable";
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openVisit, setOpenVisit] = useState<Visit | null>(null);
  const [exporting, setExporting] = useState(false);
  const [prevFilters, setPrevFilters] = useState(committedFilters);

  if (prevFilters !== committedFilters) {
    setPrevFilters(committedFilters);
    setPage(0);
  }

  useEffect(() => {
    window.localStorage.setItem(DENSITY_KEY, density);
  }, [density]);

  const params = useMemo(() => {
    const p = filterStateToParams(committedFilters);
    p.set("page", String(page));
    p.set("size", String(PAGE_SIZE));
    p.set("sort", sort);
    return p;
  }, [committedFilters, page, sort]);

  const visits = useQuery({
    queryKey: ["visits", params.toString()],
    queryFn: () => adminFetch<ApiPage<Visit>>(`/admin/visits?${params}`),
  });

  const rows = visits.data?.content ?? [];

  const pendingCheckouts = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  function handleSort(field: string) {
    setSort((current) => {
      const [currentField, currentDir] = current.split(",");
      if (currentField === field) {
        return `${field},${currentDir === "asc" ? "desc" : "asc"}`;
      }
      return `${field},asc`;
    });
  }

  function invalidateVisits() {
    queryClient.invalidateQueries({ queryKey: ["visits"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  }

  function optimisticCheckOut(ids: string[]) {
    const now = new Date().toISOString();
    queryClient.setQueriesData<ApiPage<Visit>>(
      { queryKey: ["visits"] },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.map((v) =>
            ids.includes(v.id)
              ? { ...v, status: "CHECKED_OUT" as const, checkOutTime: now }
              : v,
          ),
        };
      },
    );
  }

  function commitCheckOut(ids: string[]) {
    if (ids.length === 1) {
      adminFetch(`/admin/visits/${ids[0]}/checkout`, { method: "PATCH" })
        .then(invalidateVisits)
        .catch(() => {
          toast.error("Failed to check out visitor.");
          invalidateVisits();
        });
    } else {
      adminFetch<BulkCheckOutResponse>(`/admin/visits/bulk-checkout`, {
        method: "PATCH",
        body: JSON.stringify({ ids }),
      })
        .then((res) => {
          if (res.failed.length > 0) {
            toast.error(
              `${res.failed.length} visit(s) could not be checked out.`,
            );
          }
          invalidateVisits();
        })
        .catch(() => {
          toast.error("Failed to check out visitors.");
          invalidateVisits();
        });
    }
  }

  function checkOutWithUndo(ids: string[]) {
    optimisticCheckOut(ids);
    const timerKey = ids.join(",");
    const timer = setTimeout(() => {
      pendingCheckouts.current.delete(timerKey);
      commitCheckOut(ids);
    }, UNDO_WINDOW_MS);
    pendingCheckouts.current.set(timerKey, timer);
    setSelected(new Set());

    toast(
      `${ids.length === 1 ? "Visitor" : `${ids.length} visitors`} checked out.`,
      {
        action: {
          label: "Undo",
          onClick: () => {
            const pending = pendingCheckouts.current.get(timerKey);
            if (pending) {
              clearTimeout(pending);
              pendingCheckouts.current.delete(timerKey);
            }
            invalidateVisits();
          },
        },
      },
    );
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      if (rows.every((r) => prev.has(r.id))) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }

  async function handleExport() {
    setExporting(true);
    try {
      const response = await fetch(
        `/api/backend/admin/visits/export?${params}`,
        {
          cache: "no-store",
        },
      );
      if (!response.ok) throw new Error("export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `visits-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export visits.");
    } finally {
      setExporting(false);
    }
  }

  const selectedCheckedIn = rows.filter(
    (r) => selected.has(r.id) && r.status === "CHECKED_IN",
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Visits</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setDensity((d) =>
                d === "comfortable" ? "compact" : "comfortable",
              )
            }
          >
            {density === "comfortable" ? <Rows3 /> : <LayoutList />}
            {density === "comfortable" ? "Compact" : "Comfortable"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download /> {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
      </div>

      <FilterBar />

      <Input
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        placeholder="Search name, phone, email…"
        className="h-9 w-full rounded-lg"
      />

      {selectedCheckedIn.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/60 px-4 py-2 text-sm">
          <span>{selectedCheckedIn.length} selected</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() =>
                checkOutWithUndo(selectedCheckedIn.map((v) => v.id))
              }
            >
              Check out selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              Clear selection
            </Button>
          </div>
        </div>
      )}

      <Card flat className="overflow-x-auto p-0">
        <VisitsTable
          visits={rows}
          isLoading={visits.isLoading}
          density={density}
          selectable
          selectedIds={selected}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onRowClick={setOpenVisit}
          onSort={handleSort}
          sort={sort}
          emptyMessage={
            <div className="flex flex-col items-center gap-2">
              <span>
                No visits match {activeFilterCount(committedFilters)} filter
                {activeFilterCount(committedFilters) === 1 ? "" : "s"}.
              </span>
              {activeFilterCount(committedFilters) > 0 && (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Clear filters
                </Button>
              )}
            </div>
          }
        />
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {(visits.data?.number ?? 0) + 1} of{" "}
          {Math.max(visits.data?.totalPages ?? 1, 1)} ·{" "}
          {visits.data?.totalElements ?? 0} visits
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={
              (visits.data?.number ?? 0) + 1 >= (visits.data?.totalPages ?? 1)
            }
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <VisitDrawer
        visit={openVisit}
        onClose={() => setOpenVisit(null)}
        onCheckOut={(id) => {
          checkOutWithUndo([id]);
          setOpenVisit(null);
        }}
      />
    </div>
  );
}
