'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import Providers from "@/app/providers";
import { useI18n, type Language } from "@/lib/i18n";
import { theme } from "@/lib/theme";

type Props = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/", key: "nav.home", fallback: "Home" },
  { href: "/dashboard", key: "nav.dashboard", fallback: "Dashboard" },
  { href: "/studio", key: "nav.studio", fallback: "Studio" },
  { href: "/calendar", key: "nav.calendar", fallback: "Śaka calendar" },
  { href: "/horoscope", key: "nav.horoscope", fallback: "Horoscope" },
  { href: "/past-life", key: "nav.past", fallback: "Past lives" },
  { href: "/future", key: "nav.future", fallback: "Future" },
  { href: "/core-wisdom", key: "nav.coreWisdom", fallback: "Core wisdom" },
  { href: "/matchmaking", key: "nav.matchmaking", fallback: "Matchmaking" },
];

function LanguageToggle() {
  const { lang, setLang, availableLanguages } = useI18n();
  return (
    <label className="language-toggle" aria-label="Language toggle">
      <span className="sr-only">Language</span>
      <select value={lang} onChange={(event) => setLang(event.target.value as Language)}>
        {availableLanguages.map((option) => (
          <option key={option.code} value={option.code}>
            {option.nativeLabel} ({option.label})
          </option>
        ))}
      </select>
    </label>
  );
}

function Shell({ children }: Props) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const closeOnResize = () => setMenuOpen(false);
    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        {t("nav.skip", "Skip to content")}
      </a>

      <header className="topbar" aria-label="Site header">
        <Link href="/" className="brand" aria-label={t("nav.home", "Home")}>
          <span className="brand-mark" style={{ background: theme.gradients.brand }} aria-hidden />
          BhriguWelt
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
        <nav id="primary-navigation" className={menuOpen ? "is-open" : ""} aria-label="Main">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={() => setMenuOpen(false)}>
                  {t(link.key, link.fallback)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="topbar__actions">
          <LanguageToggle />
          <Link className="button-link" href="/matchmaking">
            {t("nav.cta", "Start a session")}
          </Link>
        </div>
      </header>

      <main id="main" className="page-shell" tabIndex={-1}>
        {children}
      </main>

      <footer className="footer" aria-label="Footer">
        <div>
          <p className="eyebrow">Bharat-centred Jyotish</p>
          <h3>{t("nav.tagline", "Quiet guidance across every stage of life.")}</h3>
          <p className="muted">{t("nav.desc", "Readable predictions, Śaka-ready conversions, and heartfelt remedies in one space.")}</p>
        </div>
        <div>
          <p className="eyebrow">{t("footer.bot", "Bhrigu Wisdom Bot")}</p>
          <h4>{t("footer.bot.title", "Ask about horoscopes, past lives, the future, and matchmaking.")}</h4>
          <ul className="soft-list">
            <li>{t("footer.bot.horoscope", "Direct answers for your current horoscope queries.")}</li>
            <li>{t("footer.bot.past", "Reflections on past lives shaped by our stored core wisdoms.")}</li>
            <li>{t("footer.bot.future", "Forward-looking predictions rooted in Jyotish guidance.")}</li>
            <li>{t("footer.bot.matchmaking", "Matchmaking insights grounded in the repository's teachings.")}</li>
          </ul>
          <p className="muted">{t("footer.bot.desc", "Every reply is drawn from the preserved corpus of Bhrigu knowledge.")}</p>
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
