import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { publicFetch } from "../../lib/http";
import { getPublicBackendUrl } from "../../lib/config-client";
import type {
  EntranceResolveResponse,
  PublicHostResponse,
} from "../../lib/types";
import { CheckInForm } from "./CheckInForm";

interface PageProps {
  searchParams: Promise<{ entrance?: string }>;
}

export default async function CheckInPage({ searchParams }: PageProps) {
  const { entrance: entranceId } = await searchParams;
  const baseUrl = getPublicBackendUrl();

  if (!entranceId) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">
          Please scan the QR code posted at the entrance, or ask reception for
          the correct check-in link.
        </p>
      </Shell>
    );
  }

  let entrance: EntranceResolveResponse;
  try {
    entrance = await publicFetch<EntranceResolveResponse>(
      baseUrl,
      `/api/public/entrances/${entranceId}`,
    );
  } catch {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find this entrance, or it isn&apos;t currently
          active. Please ask reception for a valid check-in link.
        </p>
      </Shell>
    );
  }

  let hosts: PublicHostResponse[] = [];
  try {
    hosts = await publicFetch<PublicHostResponse[]>(
      baseUrl,
      `/api/public/branches/${entrance.branchId}/hosts`,
    );
  } catch {
    hosts = [];
  }

  return (
    <Shell entrance={entrance}>
      <CheckInForm entrance={entrance} hosts={hosts} />
    </Shell>
  );
}

function Shell({
  children,
  entrance,
}: {
  children: React.ReactNode;
  entrance?: EntranceResolveResponse;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-16 sm:py-20">
      <div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to home
        </Link>
        <h1 className="mt-6 font-serif text-4xl leading-[1.05] text-foreground sm:text-5xl lg:text-6xl">
          <span className="block italic text-[#1c97d9]">Welcome.</span>
          <span className="block">Let&apos;s get you checked in.</span>
        </h1>
        {entrance && (
          <p className="mt-4 text-sm text-muted-foreground">
            {entrance.branchName} · {entrance.entranceName}
          </p>
        )}
      </div>
      <Card className="shadow-none ring-0">
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
