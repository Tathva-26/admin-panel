"use client";

import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function UnauthorizedPage() {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground">
          Access Denied (403)
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have administrator permissions to access the Tathva panel.
        </p>

        {user ? (
          <div className="mt-4 rounded-md border border-border bg-muted p-3 text-xs text-muted-foreground">
            Signed in as: <span className="font-semibold">{user.email}</span> (Role: {user.role})
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          <Button variant="primary" className="w-full" onClick={logout}>
            Sign Out & Try Another Account
          </Button>
        </div>
      </div>
    </div>
  );
}
