"use client";

import { Button } from "@/components/ui/button";
import type { Page } from "@/lib/types";

interface PaginationFooterProps {
  page: Page<unknown> | undefined;
  onPrevious: () => void;
  onNext: () => void;
  itemLabel: string;
}

/** Prev/Next + "Page X of Y · Z items" footer, shared by the paginated admin tables. */
export function PaginationFooter({
  page,
  onPrevious,
  onNext,
  itemLabel,
}: PaginationFooterProps) {
  const current = (page?.number ?? 0) + 1;
  const total = Math.max(page?.totalPages ?? 1, 1);

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Page {current} of {total} · {page?.totalElements ?? 0} {itemLabel}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={(page?.number ?? 0) === 0}
          onClick={onPrevious}
        >
          Previous
        </Button>
        <Button variant="outline" disabled={current >= total} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
