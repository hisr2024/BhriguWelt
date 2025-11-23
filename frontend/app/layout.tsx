import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import JourneyRail from "@/components/JourneyRail";

export const metadata: Metadata = {
  title: "BhriguWelt Experiences",
  description: "Modern web and mobile ready UI for the Bhrigu Samhita-powered horoscope, future, past life, matchmaking, and calendar engines.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <JourneyRail />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
