import { createAuthClient } from "better-auth/react";
import { getApiBase } from "@area/shared";

export const authClient = createAuthClient({
  baseURL: `${getApiBase()}/auth`,
});

export const { signIn, signUp, signOut, useSession } = authClient;
