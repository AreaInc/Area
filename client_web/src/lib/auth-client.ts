import { createAuthClient } from "better-auth/react";
import { API_BASE } from "@area/shared";

export const authClient = createAuthClient({
  baseURL: `${API_BASE}/auth`,
});

export const { signIn, signUp, signOut, useSession } = authClient;
