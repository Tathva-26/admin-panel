"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Spinner from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifySession } = useAuth();

  useEffect(() => {
    const processCallback = async () => {
      const token = searchParams.get("token");

      if (!token) {
        router.replace("/login?error=missing_token");
        return;
      }

      window.localStorage.setItem("jwt", token);
      window.history.replaceState({}, document.title, window.location.pathname);

      await verifySession();
      router.replace("/");
    };

    processCallback();
  }, [searchParams, router, verifySession]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="flex flex-col items-center space-y-4 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <Spinner className="h-8 w-8 text-zinc-900" />
        <p className="text-sm font-medium text-zinc-700">
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
        <div className="flex min-h-dvh items-center justify-center bg-zinc-50">
          <Spinner className="h-8 w-8 text-zinc-900" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

