import { createAuthClient } from "better-auth/react";

import { API_ORIGIN } from "@/lib/api/client";

/*
 * The backend (better-auth) owns the session in an httpOnly cookie. This client
 * only talks to it: `useSession` probes the session, `signIn.social` starts
 * Google OAuth, `signOut` clears it. No token is ever visible to JS — not in
 * state, storage, or URLs.
 */
export const { signIn, signOut, useSession } = createAuthClient({
  baseURL: API_ORIGIN,
});
