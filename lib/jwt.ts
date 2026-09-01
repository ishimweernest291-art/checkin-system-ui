import { jwtVerify } from "jose";
import type { Role } from "./types";
import { getJwtSecret } from "./config";

export const SESSION_COOKIE = "session";

export interface VerifiedSession {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  branchId: string | null;
  token: string;
}

let cachedKey: Uint8Array | null = null;

function secretKey(): Uint8Array {
  if (!cachedKey) {
    cachedKey = new TextEncoder().encode(getJwtSecret());
  }
  return cachedKey;
}

/**
 * Verifies the JWT signature/expiry issued by the Spring Boot backend and returns
 * the trusted claims. Used by proxy.ts (edge) and BFF route handlers (node).
 */
export async function verifySessionToken(
  token: string,
): Promise<VerifiedSession | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      !payload.sub ||
      typeof payload.email !== "string" ||
      typeof payload.fullName !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.sub,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role as Role,
      branchId: typeof payload.branchId === "string" ? payload.branchId : null,
      token,
    };
  } catch {
    return null;
  }
}
