import "server-only";

/**
 * Server-side environment configuration. These values are only ever read on the
 * server (route handlers, proxy, server components) — never bundled to the client.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getBackendUrl(): string {
  return process.env.BACKEND_API_URL ?? "http://localhost:8080";
}

export function getJwtSecret(): string {
  return required("JWT_SECRET");
}
