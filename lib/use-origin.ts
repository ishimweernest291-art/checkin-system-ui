"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/** Returns the current browser origin, empty string during SSR/before hydration. */
export function useOrigin(): string {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}
