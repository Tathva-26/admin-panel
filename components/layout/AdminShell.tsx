"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import CommandPalette from "@/components/common/CommandPalette";
import Spinner from "@/components/ui/Spinner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/app/login/page";
import UnauthorizedPage from "@/app/unauthorized/page";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function AdminShellContent({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, isUnauthorized } = useAuth();

  if (pathname === "/login" || pathname.startsWith("/auth/callback")) {
    return <>{children}</>;
  }

  if (
    pathname === "/unauthorized" ||
    isUnauthorized ||
    (user && user.role !== "ADMIN")
  ) {
    return <UnauthorizedPage />;
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-zinc-50">
        <Spinner className="h-8 w-8 text-zinc-900" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-50">
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setNavOpen(true)}
          onSearchClick={() => setPaletteOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminShellContent>{children}</AdminShellContent>
    </AuthProvider>
  );
}
