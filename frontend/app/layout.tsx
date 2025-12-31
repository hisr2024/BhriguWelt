import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "BhriguWelt Experiences",
  description: "Animated home with a focused dashboard.",
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
