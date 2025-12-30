import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import AnimatedLogo from "../components/AnimatedLogo";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "BhriguWelt",
  description: "World-class Bhrigu Samhita guidance with luminous insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${playfair.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to main content
        </a>
        <header className="site-header">
          <nav className="nav" aria-label="Primary">
            <a href="#top" aria-label="BhriguWelt home">
              <AnimatedLogo size="small" />
            </a>
            <div className="nav-links">
              <a href="#features">Features</a>
              <a href="#inputs">Inputs</a>
              <a href="#outputs">Outputs</a>
              <a href="#engines">Engines</a>
            </div>
            <a className="button primary" href="#inputs">
              Begin reading
            </a>
          </nav>
        </header>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
