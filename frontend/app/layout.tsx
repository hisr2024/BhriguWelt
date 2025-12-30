import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BhriguWelt · Cosmic Intelligence Studio",
  description:
    "Bhrigu Samhita-inspired astrology studio with live charting, matchmaking, and future insights.",
};

export default function RootLayout({ children: _children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body />
    </html>
  );
}
