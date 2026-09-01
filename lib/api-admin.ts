"use client";

import { ApiError } from "./http";
import type { ProblemDetail } from "./types";

/**
 * Client-side fetch helper for admin/dashboard data. Calls our own BFF proxy
 * (`/api/backend/*`) which forwards the request to the Spring Boot API with the
 * `Authorization: Bearer <jwt>` header derived server-side from the httpOnly cookie.
 */
export async function adminFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`/api/backend${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let problem: ProblemDetail | null = null;
    try {
      problem = await response.json();
    } catch {
      problem = null;
    }
    throw new ApiError(response.status, problem);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}
