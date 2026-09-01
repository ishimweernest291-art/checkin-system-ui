import { NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/config";
import type { ProblemDetail } from "@/lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.token !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { detail: "Token and password are required" },
      { status: 400 },
    );
  }

  const backendResponse = await fetch(
    `${getBackendUrl()}/api/auth/set-password`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: body.token, password: body.password }),
      cache: "no-store",
    },
  );

  if (!backendResponse.ok) {
    const problem: ProblemDetail | null = await backendResponse
      .json()
      .catch(() => null);
    return NextResponse.json(problem ?? { detail: "Unable to set password" }, {
      status: backendResponse.status,
    });
  }

  return new NextResponse(null, { status: 204 });
}
