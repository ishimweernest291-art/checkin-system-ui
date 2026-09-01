import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  verifySessionToken,
  type VerifiedSession,
} from "./jwt";

/** Reads and verifies the current request's session cookie. Returns null if absent/invalid. */
export async function getSession(): Promise<VerifiedSession | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}
