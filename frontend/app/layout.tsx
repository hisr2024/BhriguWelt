import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BhriguWelt Experiences",
  description:
    "Modern web and mobile ready UI for the Bhrigu Samhita-powered horoscope, future, past life, matchmaking, and calendar engines.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
