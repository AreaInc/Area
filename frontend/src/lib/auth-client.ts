import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: `http://${import.meta.env.VITE_DEPLOY_ADDRESS ?? "localhost"}/api`,
});

export const { signIn, signUp, signOut, useSession } = authClient;
