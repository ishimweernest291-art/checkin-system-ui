"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/format";

/** Ticking "in building · 1h 12m" label for CHECKED_IN rows. Re-renders every 30s. */
export function LiveDuration({ checkInTime }: { checkInTime: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const minutes = (now - new Date(checkInTime).getTime()) / 60_000;

  return (
    <span className="inline-flex items-center gap-1.5 text-accent-foreground">
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-foreground opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-full bg-accent-foreground" />
      </span>
      <span className="tabular-nums">{formatDuration(minutes)}</span>
    </span>
  );
}
