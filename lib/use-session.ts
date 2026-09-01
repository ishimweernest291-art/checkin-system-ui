"use client";

import { useQuery } from "@tanstack/react-query";
import type { Role } from "./types";

export interface ClientSession {
  authenticated: boolean;
  email: string;
  fullName: string;
  role: Role;
  branchId: string | null;
}

export function useSession() {
  return useQuery({
    queryKey: ["session", "me"],
    queryFn: async (): Promise<ClientSession> => {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Not authenticated");
      }
      return response.json();
    },
    staleTime: 60_000,
  });
}
