import { normalizeFilterState, type FilterState } from "./dashboard-filters";

export interface SavedView {
  id: string;
  name: string;
  filters: FilterState;
  createdAt: string;
}

const STORAGE_KEY = "checkin:saved-views";

function readAll(): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(views: SavedView[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
}

export function listSavedViews(): SavedView[] {
  return readAll()
    .map((view) => ({ ...view, filters: normalizeFilterState(view.filters) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function saveView(name: string, filters: FilterState): SavedView {
  const views = readAll();
  const view: SavedView = {
    id: crypto.randomUUID(),
    name,
    filters,
    createdAt: new Date().toISOString(),
  };
  writeAll([...views, view]);
  return view;
}

export function deleteSavedView(id: string): void {
  writeAll(readAll().filter((v) => v.id !== id));
}
