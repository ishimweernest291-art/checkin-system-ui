import { ACTIVE_STYLES } from "@/lib/badge-styles";
import { cn } from "@/lib/utils";

/** Active/inactive chip shared by the Hosts/Branches/Users admin tables. */
export function StatusBadge({ active }: { active: boolean }) {
  const style = active ? ACTIVE_STYLES.active : ACTIVE_STYLES.inactive;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        style.className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}
