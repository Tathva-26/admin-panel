"use client";

import { ThemeProvider as NextThemeProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * next-themes writes the `dark` class onto <html>, which is what the `.dark`
 * token block in globals.css hangs off.
 *
 * `defaultTheme="system"` means the panel follows the OS until someone chooses
 * otherwise; the choice is then remembered per browser.
 */
export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      // The transition would otherwise animate every colour on the page at once
      // while switching, which reads as a flash rather than a change.
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
