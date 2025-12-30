import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";

import "./globals.css";
import Navigation from "./components/Navigation";
import SkipLink from "./components/SkipLink";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "BhriguWelt · Cosmic Intelligence Studio",
  description:
    "Bhrigu Samhita-inspired astrology studio with live charting, matchmaking, and future insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${manrope.variable} scroll-smooth`}>
      <body className="font-body">
        <SkipLink />
        <Navigation />
        {children}
        <footer className="border-t border-white/10 bg-slate-950/80 px-6 py-10 text-center text-xs text-slate-400">
          Crafted for seekers · Offline-ready experiences across web and mobile.
        </footer>
      </body>
    </html>
  );
}
