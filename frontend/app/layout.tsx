import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import AppShell from "@/components/AppShell";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "BhriguWelt Astrology",
  description:
    "World-class astrology experiences with dark-first design, smooth motion, and sharp results across every engine.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    title: "BhriguWelt",
    statusBarStyle: "black-translucent",
  },
};

export const viewport = {
  themeColor: "#0b1017",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const enableAnalytics = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "true";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-midnight text-slate-100">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        {enableAnalytics ? <Analytics /> : null}
      </body>
    </html>
  );
}
