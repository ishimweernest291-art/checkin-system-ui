import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface PageProps {
  searchParams: Promise<{ ref?: string; time?: string }>;
}

export default async function CheckInSuccessPage({ searchParams }: PageProps) {
  const { ref, time } = await searchParams;
  const checkInTime = time
    ? new Date(time).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[#1c97d9]/10">
        <CheckCircle2 className="size-6 text-[#1c97d9]" />
      </div>

      <div>
        <h1 className="font-serif text-4xl italic text-foreground sm:text-5xl">
          You&apos;re checked in.
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted-foreground">
          Your visit has been recorded successfully. Keep your reference code
          handy — you&apos;ll need it (or your phone number) to check out.
        </p>
      </div>

      <Separator className="w-full max-w-xs" />

      <div className="flex flex-col gap-4">
        {ref && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Reference
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-wide text-foreground">
              {ref}
            </p>
          </div>
        )}
        {checkInTime && (
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Checked in at
            </p>
            <p className="mt-1 text-sm text-foreground">{checkInTime}</p>
          </div>
        )}
      </div>

      <Button asChild className="mt-2 h-12 rounded-full px-8 text-base">
        <Link href="/">Return home</Link>
      </Button>
    </main>
  );
}
