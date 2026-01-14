import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: `https://${import.meta.env.VITE_DEPLOY_ADDRESS ?? "localhost"}/api/auth`,
});

export const { signIn, signUp, signOut, useSession } = authClient;
