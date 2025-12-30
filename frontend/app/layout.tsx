import type { Metadata, Viewport } from "next";
import "./globals.css";

import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "BhriguWelt",
  description: "Bhrigu Samhita engines for horoscope, past-life, future, matchmaking, and calendar insights.",
  manifest: "/manifest.json",
  applicationName: "BhriguWelt",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BhriguWelt",
  },
  icons: {
    icon: "/logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="text-slate-100">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <AppShell>
          <main id="main" tabIndex={-1} className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
            {children}
          </main>
        </AppShell>
      </body>
    </html>
  );
}
