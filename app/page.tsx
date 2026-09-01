import Image from "next/image";
import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center px-6 py-16 lg:px-8">
      <div className="mx-auto grid w-11/12 max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            timbuktoo - <span className="font-bold">HealthTech Hub</span> Visitor management system.
          </p>
          <h1 className="font-serif text-4xl leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
            <span className="block italic text-[#1c97d9]">Effortless</span>
            <span className="block italic text-[#1c97d9]">guest check-ins</span>
            <span className="block">from arrival onward</span>
            <span className="block">with ease</span>
          </h1>
          <p className="mt-6 max-w-md text-sm text-muted-foreground">
            Check in and check out in seconds with a secure, simple visitor
            management experience designed for every guest.
          </p>

          <div className="mt-16 flex flex-wrap items-center gap-4">
            <Button asChild className="h-12 rounded-full px-8">
              <Link href="/check-in">
                <LogIn className="size-4" />
                Check In
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full px-8"
            >
              <Link href="/check-out">
                <LogOut className="size-4" />
                Check Out
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto aspect-11/10 w-full max-w-xl overflow-hidden rounded-2xl bg-muted">
          <div className="absolute inset-0 left-0 w-full">
            <Image
              src="/welcome.png"
              alt="Visitor being welcomed at the front desk"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="absolute bottom-4 left-4 max-w-[calc(100%-5.5rem)] rounded-xl bg-background/95 p-4 shadow-lg ring-1 ring-foreground/10 backdrop-blur">
            <p className="font-semibold text-foreground">Visitor</p>
            <p className="text-sm">Walk-in Check-In</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary">Fast</Badge>
              <Badge variant="secondary">Secure</Badge>
              <Badge variant="secondary">Simple</Badge>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
