import type { Metadata } from "next";
import Link from "next/link";
import { getCopy, type Locale } from "@/lib/i18n";
import "./globals.css";

const locale = process.env.NEXT_PUBLIC_LOCALE as Locale | undefined;
const copy = getCopy(locale);
const navLinks = [
  { href: "/", label: copy.nav.home },
  { href: "/horoscope", label: copy.nav.horoscope },
  { href: "/past-life", label: copy.nav.pastLife },
  { href: "/future", label: copy.nav.future },
  { href: "/matchmaking", label: copy.nav.matchmaking },
  { href: "/calendar", label: copy.nav.calendar },
];

export const metadata: Metadata = {
  title: "BhriguWelt Experiences",
  description:
    "Modern web and mobile ready UI for the Bhrigu Samhita-powered horoscope, future, past life, matchmaking, and calendar engines.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={locale ?? "en"}>
      <body className="app-body">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div className="bg-aurora" aria-hidden />
        <header className="nav-shell">
          <div className="nav-bar">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden />
              {copy.brand}
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
              {copy.hero.primaryCta}
            </Link>
          </div>
        </header>
        <main id="main" className="page-wrapper">
          {children}
        </main>
        <footer className="footer">
          <div>
            <p className="eyebrow">Bhrigu Samhita native</p>
            <h3>{copy.footer.tagline}</h3>
            <p className="muted">{copy.footer.description}</p>
          </div>
          <div className="footer-links">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <Link href="/">{copy.nav.home}</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
