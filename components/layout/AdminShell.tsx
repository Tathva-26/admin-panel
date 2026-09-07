"use client";

import { useState, type ReactNode } from "react";

import CommandPalette from "@/components/common/CommandPalette";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

/**
 * Fixed sidebar on desktop, off-canvas drawer on mobile.
 *
 * The shell owns the only scroll container so the sidebar and topbar stay put
 * on long tables. Height is `dvh` rather than `vh` because mobile browsers
 * shrink the viewport as the address bar hides, and `vh` would leave the last
 * row under it.
 */
export default function AdminShell({ children }: { children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          onMenuClick={() => setNavOpen(true)}
          onSearchClick={() => setPaletteOpen(true)}
        />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {children}
        </main>
      </div>

      {/* Owns the global Cmd/Ctrl+K binding, so it lives above the routes. */}
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
