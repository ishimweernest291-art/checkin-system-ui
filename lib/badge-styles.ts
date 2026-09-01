import type { VisitPurpose, VisitStatus } from "./types";

/** Fixed hue per purpose so the same purpose always renders the same chip, low-opacity tint + dark text. */
export const PURPOSE_STYLES: Record<
  VisitPurpose,
  { label: string; className: string; dot: string }
> = {
  MEETING: {
    label: "Meeting",
    className: "bg-blue-50 text-blue-700",
    dot: "bg-blue-600",
  },
  DELIVERY: {
    label: "Delivery",
    className: "bg-amber-50 text-amber-700",
    dot: "bg-amber-600",
  },
  INTERVIEW: {
    label: "Interview",
    className: "bg-violet-50 text-violet-700",
    dot: "bg-violet-600",
  },
  OTHER: {
    label: "Other",
    className: "bg-neutral-100 text-neutral-700",
    dot: "bg-neutral-500",
  },
};

export const STATUS_STYLES: Record<
  VisitStatus,
  { label: string; className: string; dot: string }
> = {
  CHECKED_IN: {
    label: "Checked in",
    className: "bg-accent text-accent-foreground",
    dot: "bg-accent-foreground",
  },
  CHECKED_OUT: {
    label: "Checked out",
    className: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

/** Shared active/inactive chip used by the Hosts/Branches/Users admin tables. */
export const ACTIVE_STYLES: Record<
  "active" | "inactive",
  { label: string; className: string; dot: string }
> = {
  active: {
    label: "Active",
    className: "bg-success/15 text-success",
    dot: "bg-success",
  },
  inactive: {
    label: "Inactive",
    className: "bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};
