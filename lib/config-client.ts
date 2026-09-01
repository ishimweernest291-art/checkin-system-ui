/** Public, browser-exposed backend URL for unauthenticated check-in/check-out calls. */
export function getPublicBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
}
