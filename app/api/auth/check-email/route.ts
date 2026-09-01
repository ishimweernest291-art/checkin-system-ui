import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/config";
import type { CheckEmailResponse, ProblemDetail } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== "string") {
    return NextResponse.json({ detail: "Email is required" }, { status: 400 });
  }

  const backendResponse = await fetch(
    `${getBackendUrl()}/api/auth/check-email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email }),
      cache: "no-store",
    },
  );

  if (!backendResponse.ok) {
    const problem: ProblemDetail | null = await backendResponse
      .json()
      .catch(() => null);
    return NextResponse.json(problem ?? { detail: "Unable to verify email" }, {
      status: backendResponse.status,
    });
  }

  const result: CheckEmailResponse = await backendResponse.json();
  return NextResponse.json(result);
}
