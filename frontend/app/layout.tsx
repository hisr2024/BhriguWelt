import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";

import "./globals.css";
import Navigation from "./components/Navigation";
import SkipLink from "./components/SkipLink";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "BhriguWelt · Cosmic Intelligence Studio",
  description:
    "Bhrigu Samhita-inspired astrology studio with live charting, matchmaking, and future insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans bg-hero-gradient min-h-screen`}>
        <SkipLink />
        <Navigation />
        {children}
      </body>
    </html>
  );
}
