'use client';

import Link from "next/link";
import Providers from "@/app/providers";
import { useI18n } from "@/lib/i18n";

type Props = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/", key: "nav.home", fallback: "Home" },
  { href: "/horoscope", key: "nav.horoscope", fallback: "Horoscope" },
  { href: "/past-life", key: "nav.past", fallback: "Past lives" },
  { href: "/future", key: "nav.future", fallback: "Future" },
  { href: "/matchmaking", key: "nav.matchmaking", fallback: "Matchmaking" },
  { href: "/calendar", key: "nav.calendar", fallback: "Śaka calendar" },
];

function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <div className="language-toggle" aria-label="Language toggle">
      <button
        type="button"
        className={lang === "en" ? "active" : ""}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
      <button
        type="button"
        className={lang === "hi" ? "active" : ""}
        onClick={() => setLang("hi")}
        aria-pressed={lang === "hi"}
      >
        हिंदी
      </button>
    </div>
  );
}

function Shell({ children }: Props) {
  const { t } = useI18n();

  return (
    <>
      <a href="#main" className="skip-link">
        {t("nav.skip", "Skip to content")}
      </a>
      <div className="bg-aurora" aria-hidden />
      <header className="nav-shell">
        <div className="nav-bar">
          <Link href="/" className="brand" aria-label={t("nav.home", "Home")}> 
            <span className="brand-mark" aria-hidden />
            BhriguWelt
          </Link>
          <nav aria-label="Main">
            <ul>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{t(link.key, link.fallback)}</Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="nav-actions">
            <LanguageToggle />
            <Link className="cta" href="/matchmaking">
              {t("nav.cta", "Try the studio")}
            </Link>
          </div>
        </div>
      </header>
      <main id="main" className="page-wrapper">
        {children}
      </main>
      <footer className="footer" aria-label="Footer">
        <div>
          <p className="eyebrow">Bhrigu Samhita</p>
          <h3>{t("nav.tagline", "Ancient wisdom, modern calm for every generation.")}</h3>
          <p className="muted">{t("nav.desc", "Share Bhrigu insights across responsive web, Vercel previews, and Android/iOS builds.")}</p>
        </div>
        <div className="footer-links">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              {t(link.key, link.fallback)}
            </Link>
          ))}
          <Link href="/">{t("nav.home", "Home")}</Link>
        </div>
      </footer>
    </>
  );
}

export default function AppShell({ children }: Props) {
  return (
    <Providers>
      <Shell>{children}</Shell>
    </Providers>
  );
}
