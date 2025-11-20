import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const navLinks = [
  { href: "/horoscope", label: "Horoscope" },
  { href: "/past-life", label: "Past lives" },
  { href: "/future", label: "Future" },
  { href: "/matchmaking", label: "Matchmaking" },
  { href: "/calendar", label: "Śaka calendar" },
];

export const metadata: Metadata = {
  title: "BhriguWelt Experiences",
  description:
    "Modern web and mobile ready UI for the Bhrigu Samhita-powered horoscope, future, past life, matchmaking, and calendar engines.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">
        <div className="bg-aurora" aria-hidden />
        <header className="nav-shell">
          <div className="nav-bar">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden />
              BhriguWelt
            </Link>
            <nav>
              <ul>
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <Link className="cta" href="/matchmaking">
              Try the studio
            </Link>
          </div>
        </header>
        <main className="page-wrapper">{children}</main>
        <footer className="footer">
          <div>
            <p className="eyebrow">Bhrigu Samhita native</p>
            <h3>Designed for Gen Z, accessible for every generation.</h3>
            <p className="muted">
              Crafted for responsive web, Vercel deployments, and the Android/iOS builds you want to ship next.
            </p>
          </div>
          <div className="footer-links">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <Link href="/">Home</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
