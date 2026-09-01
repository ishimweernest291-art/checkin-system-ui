"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SimpleSelect } from "@/components/ui/simple-select";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { adminFetch } from "@/lib/api-admin";
import { useSession } from "@/lib/use-session";
import { useFilters } from "./FilterProvider";
import {
  PRESETS,
  WEEKDAY_LABELS,
  WEEKDAY_NAMES,
  activeFilterCount,
  formatRange,
  monthOptions,
  periodLabel,
  quarterOptions,
  yearOptions,
  type Preset,
} from "@/lib/dashboard-filters";
import {
  deleteSavedView,
  listSavedViews,
  saveView,
  type SavedView,
} from "@/lib/saved-views";
import type { Branch, Entrance, VisitPurpose, VisitStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const PURPOSE_OPTIONS: { value: VisitPurpose | ""; label: string }[] = [
  { value: "", label: "Any purpose" },
  { value: "MEETING", label: "Meeting" },
  { value: "DELIVERY", label: "Delivery" },
  { value: "INTERVIEW", label: "Interview" },
  { value: "OTHER", label: "Other" },
];

const STATUS_OPTIONS: { value: VisitStatus | ""; label: string }[] = [
  { value: "", label: "Any status" },
  { value: "CHECKED_IN", label: "Checked in" },
  { value: "CHECKED_OUT", label: "Checked out" },
];

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex divide-x divide-border overflow-hidden rounded-lg border border-border">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
            value === opt.value
              ? "bg-foreground text-background"
              : "bg-background text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function PeriodMenu({
  label,
  active,
  activeLabel,
  options,
  selected,
  onSelect,
}: {
  label: string;
  active: boolean;
  activeLabel: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Select ${label.toLowerCase()}`}
          suppressHydrationWarning
          className={cn(
            "inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
            active
              ? "bg-foreground text-background"
              : "bg-background text-muted-foreground hover:text-foreground",
          )}
        >
          {active ? activeLabel : label}
          <ChevronDown className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-72 w-48 overflow-y-auto">
        <div className="flex flex-col">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
              className={cn(
                "rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                active && selected === opt.value && "font-medium text-primary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function FilterBar() {
  const { data: session } = useSession();
  const { filters, setFilters, applyPreset, resetFilters } = useFilters();
  const [expanded, setExpanded] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>(() =>
    listSavedViews(),
  );
  const [viewName, setViewName] = useState("");

  // The slider is driven locally while dragging; committing on release keeps the URL
  // (and every dependent query) from churning on every pointer move.
  const [hourRange, setHourRange] = useState<[number, number]>([
    filters.hourStart,
    filters.hourEnd,
  ]);
  const [syncedHours, setSyncedHours] = useState<[number, number]>([
    filters.hourStart,
    filters.hourEnd,
  ]);
  if (
    syncedHours[0] !== filters.hourStart ||
    syncedHours[1] !== filters.hourEnd
  ) {
    setSyncedHours([filters.hourStart, filters.hourEnd]);
    setHourRange([filters.hourStart, filters.hourEnd]);
  }

  const count = activeFilterCount(filters);

  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => adminFetch<Branch[]>("/admin/branches"),
    enabled: session?.role === "MANAGER",
  });

  const entrances = useQuery({
    queryKey: ["entrances", filters.branchId],
    queryFn: () =>
      adminFetch<Entrance[]>(
        `/admin/entrances${filters.branchId ? `?branchId=${filters.branchId}` : ""}`,
      ),
  });

  const effectiveWeekdays = useMemo(
    () =>
      filters.weekdays.length === 0 ? [1, 2, 3, 4, 5, 6, 7] : filters.weekdays,
    [filters.weekdays],
  );

  function toggleWeekday(day: number) {
    const isOn = effectiveWeekdays.includes(day);
    // An empty list means "all days" downstream, so the last active day can't be cleared.
    if (isOn && effectiveWeekdays.length === 1) return;
    const next = isOn
      ? effectiveWeekdays.filter((d) => d !== day)
      : [...effectiveWeekdays, day].sort((a, b) => a - b);
    setFilters({ weekdays: next.length === 7 ? [] : next });
  }

  function chips(): { key: string; label: string; clear: () => void }[] {
    const list: { key: string; label: string; clear: () => void }[] = [];
    if (filters.branchId) {
      const name =
        branches.data?.find((b) => b.id === filters.branchId)?.name ?? "Branch";
      list.push({
        key: "branch",
        label: name,
        clear: () => setFilters({ branchId: "" }),
      });
    }
    if (filters.entranceId) {
      const name =
        entrances.data?.find((e) => e.id === filters.entranceId)?.name ??
        "Entrance";
      list.push({
        key: "entrance",
        label: name,
        clear: () => setFilters({ entranceId: "" }),
      });
    }
    if (filters.purpose) {
      list.push({
        key: "purpose",
        label:
          PURPOSE_OPTIONS.find((p) => p.value === filters.purpose)?.label ??
          filters.purpose,
        clear: () => setFilters({ purpose: "" }),
      });
    }
    if (filters.status) {
      list.push({
        key: "status",
        label:
          STATUS_OPTIONS.find((s) => s.value === filters.status)?.label ??
          filters.status,
        clear: () => setFilters({ status: "" }),
      });
    }
    if (filters.weekdays.length > 0 && filters.weekdays.length < 7) {
      list.push({
        key: "weekdays",
        label: filters.weekdays.map((d) => WEEKDAY_LABELS[d - 1]).join(""),
        clear: () => setFilters({ weekdays: [] }),
      });
    }
    if (filters.hourStart > 0 || filters.hourEnd < 23) {
      list.push({
        key: "hours",
        label: `${filters.hourStart}:00–${filters.hourEnd}:00`,
        clear: () => setFilters({ hourStart: 0, hourEnd: 23 }),
      });
    }
    return list;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          options={PRESETS}
          value={filters.preset}
          onChange={(v) => applyPreset(v as Preset)}
        />

        <PeriodMenu
          label="Month"
          active={filters.preset === "MONTH"}
          activeLabel={periodLabel("MONTH", filters.period)}
          options={monthOptions()}
          selected={filters.period}
          onSelect={(value) => applyPreset("MONTH", value)}
        />
        <PeriodMenu
          label="Quarter"
          active={filters.preset === "QUARTER"}
          activeLabel={periodLabel("QUARTER", filters.period)}
          options={quarterOptions()}
          selected={filters.period}
          onSelect={(value) => applyPreset("QUARTER", value)}
        />
        <PeriodMenu
          label="Year"
          active={filters.preset === "YEAR"}
          activeLabel={periodLabel("YEAR", filters.period)}
          options={yearOptions()}
          selected={filters.period}
          onSelect={(value) => applyPreset("YEAR", value)}
        />

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Checkbox
            checked={filters.comparePrevious}
            onCheckedChange={(checked) =>
              setFilters({ comparePrevious: checked === true })
            }
          />
          Compare to previous period
        </label>

        <div className="ml-auto flex items-center gap-2">
          {count > 0 && (
            <Button variant="ghost" size="sm" onClick={() => resetFilters()}>
              <X /> Clear all
            </Button>
          )}
          <SavedViewsMenu
            views={savedViews}
            viewName={viewName}
            onViewNameChange={setViewName}
            onSave={() => {
              if (!viewName.trim()) return;
              saveView(viewName.trim(), filters);
              setSavedViews(listSavedViews());
              setViewName("");
            }}
            onApply={(view) => setFilters(view.filters)}
            onDelete={(id) => {
              deleteSavedView(id);
              setSavedViews(listSavedViews());
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            <SlidersHorizontal />
            Filters
            {count > 0 && (
              <Badge variant="secondary" className="ml-0.5">
                {count}
              </Badge>
            )}
            <ChevronDown
              className={cn("transition-transform", expanded && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" suppressHydrationWarning>
        {formatRange(new Date(filters.from), new Date(filters.to))}
      </p>

      {!expanded && chips().length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips().map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {chip.label}
              <X className="size-3" />
            </button>
          ))}
        </div>
      )}

      {expanded && (
        <div className="grid grid-cols-1 gap-4 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
          {session?.role === "MANAGER" && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Branch</Label>
              <SimpleSelect
                value={filters.branchId}
                onChange={(v) => setFilters({ branchId: v, entranceId: "" })}
                placeholder="All branches"
                options={[
                  { value: "", label: "All branches" },
                  ...(branches.data ?? []).map((b) => ({
                    value: b.id,
                    label: b.name,
                  })),
                ]}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Entrance</Label>
            <SimpleSelect
              value={filters.entranceId}
              onChange={(v) => setFilters({ entranceId: v })}
              placeholder="All entrances"
              options={[
                { value: "", label: "All entrances" },
                ...(entrances.data ?? []).map((e) => ({
                  value: e.id,
                  label: e.name,
                })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Purpose</Label>
            <SimpleSelect
              value={filters.purpose}
              onChange={(v) => setFilters({ purpose: v })}
              placeholder="Any purpose"
              options={PURPOSE_OPTIONS.map((p) => ({
                value: p.value,
                label: p.label,
              }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <SimpleSelect
              value={filters.status}
              onChange={(v) => setFilters({ status: v })}
              placeholder="Any status"
              options={STATUS_OPTIONS.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              Hour of day: {hourRange[0]}:00–{hourRange[1]}:00
            </Label>
            <Slider
              min={0}
              max={23}
              step={1}
              value={hourRange}
              onValueChange={([start, end]) => setHourRange([start, end])}
              onValueCommit={([start, end]) =>
                setFilters({ hourStart: start, hourEnd: end })
              }
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label className="text-xs text-muted-foreground">
              Days of week
            </Label>
            <div className="inline-flex gap-1">
              {WEEKDAY_LABELS.map((label, index) => {
                const day = index + 1;
                const active = effectiveWeekdays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeekday(day)}
                    aria-pressed={active}
                    title={WEEKDAY_NAMES[index]}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg border border-border text-xs font-medium transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SavedViewsMenu({
  views,
  viewName,
  onViewNameChange,
  onSave,
  onApply,
  onDelete,
}: {
  views: SavedView[];
  viewName: string;
  onViewNameChange: (v: string) => void;
  onSave: () => void;
  onApply: (view: SavedView) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark /> Saved views
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="flex flex-col gap-1">
          {views.length === 0 && (
            <p className="px-1 py-1 text-xs text-muted-foreground">
              No saved views yet.
            </p>
          )}
          {views.map((view) => (
            <div
              key={view.id}
              className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-muted"
            >
              <button
                type="button"
                onClick={() => onApply(view)}
                className="flex-1 truncate text-left text-sm"
              >
                {view.name}
              </button>
              <button
                type="button"
                onClick={() => onDelete(view.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${view.name}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 border-t border-border pt-2">
          <Input
            value={viewName}
            onChange={(e) => onViewNameChange(e.target.value)}
            placeholder="View name"
            className="h-8 flex-1 rounded-lg text-sm"
          />
          <Button size="sm" onClick={onSave} disabled={!viewName.trim()}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
