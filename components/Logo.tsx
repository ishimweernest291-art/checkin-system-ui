import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  priority?: boolean;
}

/** Externalized UNDP mark so header and login views share one source of truth. */
export function Logo({ className, priority }: LogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="UNDP"
      width={1000}
      height={500}
      priority={priority}
      className={cn("h-auto w-64", className)}
    />
  );
}
