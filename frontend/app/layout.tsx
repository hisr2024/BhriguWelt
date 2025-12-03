import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";
import JourneyRail from "@/components/JourneyRail";
import WizardProgress from "@/components/WizardProgress";

export const metadata: Metadata = {
  title: "KIAAN — MindVibe Companion",
  description:
    "Calm, premium guidance for MindVibe with animated KIAAN identity, soothing gradients, and emotionally intelligent rituals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <WizardProgress />
        <JourneyRail />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
