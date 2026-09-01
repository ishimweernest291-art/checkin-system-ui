"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowRight, HelpCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();

  const WITHOUT_HEADER_PATHS = [
    "/login",
    "/dashboard",
    "/forgot-password",
    "/reset-password",
    "/set-password",
  ];

  // dashboard has its own header, avoid rendering this one there
  if (WITHOUT_HEADER_PATHS.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-20 w-11/12 max-w-6xl items-center justify-between gap-4 sm:h-24 lg:h-28">
        <Link href="/" className="flex shrink-0 items-center">
          <Logo
            priority
            className="h-6 w-auto sm:h-8 lg:h-14"
          />
        </Link>
        <div className="flex items-center gap-2 text-sm sm:gap-4 sm:text-base">
          <Link
            href="/help"
            className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground text-sm"
          >
            <HelpCircle className="size-4 shrink-0" />
            <span className="hidden sm:inline">Need help?</span>
          </Link>
          <Button
            asChild
            className="h-9 rounded-full px-4 text-xs sm:h-10 sm:px-5 lg:h-11 lg:px-6 sm:text-sm"
          >
            <Link href="/login">
              <ArrowRight className="size-4" />
              <span>Sign In As Staff</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
