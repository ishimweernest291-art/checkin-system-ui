import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/config";
import type { ProblemDetail, VerifyOtpResponse } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.email !== "string" || typeof body.otp !== "string") {
    return NextResponse.json(
      { detail: "Email and code are required" },
      { status: 400 },
    );
  }

  const backendResponse = await fetch(
    `${getBackendUrl()}/api/auth/verify-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, otp: body.otp }),
      cache: "no-store",
    },
  );

  if (!backendResponse.ok) {
    const problem: ProblemDetail | null = await backendResponse
      .json()
      .catch(() => null);
    return NextResponse.json(problem ?? { detail: "Invalid or expired code" }, {
      status: backendResponse.status,
    });
  }

  const result: VerifyOtpResponse = await backendResponse.json();
  return NextResponse.json(result);
}
