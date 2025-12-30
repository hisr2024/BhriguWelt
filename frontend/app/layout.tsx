import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BhriguWelt Astrology",
  description:
    "Gen Z-ready cosmic intelligence with neon glassmorphism, instant rituals, and 13 live engines.",
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
  themeColor: "#05070f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const enableAnalytics = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "true";

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-ink-950 text-white antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
        {enableAnalytics ? <Analytics /> : null}
      </body>
    </html>
  );
}
