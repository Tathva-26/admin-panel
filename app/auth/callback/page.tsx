"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";

import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

/*
 * OAuth landing page. Google returns to the backend callback, which sets the
 * httpOnly session cookie and redirects here with no token in the URL. This
 * page waits for the session and profile to load, then routes on.
 */
function CallbackContent() {
  const router = useRouter();
  const { user, loading, isUnauthorized, error } = useAuth();

  useEffect(() => {
    if (loading) return;
    // A signed-in non-admin goes to "/" too: the shell shows the access-denied
    // page there, with a sign-out button.
    if (user || isUnauthorized) router.replace("/");
    else if (error) router.replace("/login?error=server_error");
    else router.replace("/login?error=unauthorized");
  }, [loading, user, isUnauthorized, error, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center space-y-4 rounded-xl border border-border bg-card p-8 shadow-sm">
        <Spinner className="h-8 w-8 text-foreground" />
        <p className="text-sm font-medium text-foreground">
          Authenticating session...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <Spinner className="h-8 w-8 text-foreground" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

