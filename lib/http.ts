import type { ProblemDetail } from "./types";

export class ApiError extends Error {
  status: number;
  problem: ProblemDetail | null;

  constructor(status: number, problem: ProblemDetail | null) {
    super(problem?.detail ?? `Request failed with status ${status}`);
    this.status = status;
    this.problem = problem;
  }
}

async function parseError(response: Response): Promise<ApiError> {
  let problem: ProblemDetail | null = null;
  try {
    problem = await response.json();
  } catch {
    problem = null;
  }
  return new ApiError(response.status, problem);
}

/** Fetch wrapper for the unauthenticated public endpoints, called directly from the browser. */
export async function publicFetch<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}
