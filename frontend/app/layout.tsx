import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Poppins } from "next/font/google";

import Navigation from "@/components/Navigation";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins" });

export const metadata: Metadata = {
  title: "BhriguWelt — Cosmic Intelligence",
  description: "Gen Z ready Bhrigu Samhita experience with neon, glass, and cosmic guidance.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${poppins.variable} font-inter`}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
