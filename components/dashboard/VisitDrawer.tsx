"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownCircle, Mail, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/lib/api-admin";
import {
  durationMinutesBetween,
  formatDuration,
  formatRelativeTime,
  initials,
} from "@/lib/format";
import { PURPOSE_STYLES, STATUS_STYLES } from "@/lib/badge-styles";
import { LiveDuration } from "./LiveDuration";
import type { Visit } from "@/lib/types";
import { cn } from "@/lib/utils";

export function VisitDrawer({
  visit,
  onClose,
  onCheckOut,
}: {
  visit: Visit | null;
  onClose: () => void;
  onCheckOut: (id: string) => void;
}) {
  const history = useQuery({
    queryKey: ["visits", "by-phone", visit?.phone],
    queryFn: () =>
      adminFetch<Visit[]>(
        `/admin/visits/by-phone/${encodeURIComponent(visit!.phone)}`,
      ),
    enabled: !!visit,
  });

  return (
    <DialogPrimitive.Root
      open={!!visit}
      onOpenChange={(open) => !open && onClose()}
    >
      <AnimatePresence>
        {visit && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col gap-6 overflow-y-auto border-l border-border bg-popover p-6"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 320 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                      {initials(visit.fullName)}
                    </div>
                    <div>
                      <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                        {visit.fullName}
                      </DialogPrimitive.Title>
                      <p className="text-xs text-muted-foreground">
                        {visit.reference}
                      </p>
                    </div>
                  </div>
                  <DialogPrimitive.Close asChild>
                    <Button variant="ghost" size="icon-sm" aria-label="Close">
                      <X />
                    </Button>
                  </DialogPrimitive.Close>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                      PURPOSE_STYLES[visit.purpose].className,
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        PURPOSE_STYLES[visit.purpose].dot,
                      )}
                    />
                    {PURPOSE_STYLES[visit.purpose].label}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLES[visit.status].className,
                    )}
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        STATUS_STYLES[visit.status].dot,
                      )}
                    />
                    {STATUS_STYLES[visit.status].label}
                  </span>
                  {visit.priorVisitCount > 0 && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      ×{visit.priorVisitCount + 1} visits
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="size-3.5" /> {visit.phone}
                  </div>
                  {visit.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="size-3.5" /> {visit.email}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Host</p>
                    <p className="text-foreground">{visit.hostName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Branch</p>
                    <p className="text-foreground">{visit.branchName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Entrance</p>
                    <p className="text-foreground">{visit.entranceName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="tabular-nums text-foreground">
                      {visit.status === "CHECKED_IN" ? (
                        <LiveDuration checkInTime={visit.checkInTime} />
                      ) : (
                        formatDuration(
                          durationMinutesBetween(
                            visit.checkInTime,
                            visit.checkOutTime,
                          ),
                        )
                      )}
                    </p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="mb-3 text-xs font-medium text-muted-foreground">
                    Timeline
                  </p>
                  <ol className="flex flex-col gap-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-foreground" />
                      <span>
                        Checked in{" "}
                        <span className="text-muted-foreground">
                          ({formatRelativeTime(visit.checkInTime)})
                        </span>
                      </span>
                    </li>
                    {visit.checkOutTime ? (
                      <li className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                        <span>
                          Checked out{" "}
                          <span className="text-muted-foreground">
                            ({formatRelativeTime(visit.checkOutTime)})
                          </span>
                        </span>
                      </li>
                    ) : (
                      <li className="flex items-start gap-2 text-accent-foreground">
                        <span className="mt-1 size-1.5 shrink-0 animate-pulse rounded-full bg-accent-foreground" />
                        <span>Currently inside</span>
                      </li>
                    )}
                  </ol>
                </div>

                {history.data && history.data.length > 1 && (
                  <div className="border-t border-border pt-4">
                    <p className="mb-3 text-xs font-medium text-muted-foreground">
                      Visitor history
                    </p>
                    <ul className="flex flex-col gap-2 text-sm">
                      {history.data
                        .filter((v) => v.id !== visit.id)
                        .slice(0, 10)
                        .map((v) => (
                          <li
                            key={v.id}
                            className="flex items-center justify-between text-muted-foreground"
                          >
                            <span>{formatRelativeTime(v.checkInTime)}</span>
                            <span className="text-foreground">
                              {v.branchName} · {v.entranceName}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                {visit.status === "CHECKED_IN" && (
                  <div className="mt-auto border-t border-border pt-4">
                    <Button
                      className="w-full"
                      onClick={() => onCheckOut(visit.id)}
                    >
                      <ArrowDownCircle /> Check out
                    </Button>
                  </div>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}
