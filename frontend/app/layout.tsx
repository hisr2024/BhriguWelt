import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "BhriguWelt Experiences",
  description: "Modern web and mobile ready UI for the Bhrigu Samhita-powered horoscope, future, past life, matchmaking, and calendar engines.",
  manifest: "/manifest.json",
  themeColor: "#f7f4ec",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  appleWebApp: {
    capable: true,
    title: "BhriguWelt",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#f7f4ec",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
