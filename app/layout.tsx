import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import AdminShell from "@/components/layout/AdminShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tathva '26 Admin",
  description: "Internal admin panel for Tathva '26.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AdminShell>{children}</AdminShell>
      </body>
    </html>
  );
}
