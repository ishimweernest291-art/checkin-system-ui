import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getBackendUrl, getJwtSecret } from "../../../../lib/config";
import { SESSION_COOKIE } from "../../../../lib/jwt";
import type { LoginResponse, ProblemDetail } from "../../../../lib/types";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { detail: "Email and password are required" },
      { status: 400 },
    );
  }

  const backendResponse = await fetch(`${getBackendUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
    cache: "no-store",
  });

  if (!backendResponse.ok) {
    const problem: ProblemDetail | null = await backendResponse
      .json()
      .catch(() => null);
    return NextResponse.json(problem ?? { detail: "Login failed" }, {
      status: backendResponse.status,
    });
  }

  const login: LoginResponse = await backendResponse.json();

  let maxAge = 60 * 60 * 8; // 8h fallback
  try {
    const { payload } = await jwtVerify(
      login.token,
      new TextEncoder().encode(getJwtSecret()),
    );
    if (typeof payload.exp === "number") {
      maxAge = Math.max(60, payload.exp - Math.floor(Date.now() / 1000));
    }
  } catch {
    // fall back to default maxAge
  }

  const response = NextResponse.json({
    email: login.email,
    fullName: login.fullName,
    role: login.role,
    branchId: login.branchId,
  });
  response.cookies.set(SESSION_COOKIE, login.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return response;
}
