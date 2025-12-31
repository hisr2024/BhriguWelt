'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import Providers from "@/app/providers";
import BhriguChat from "@/components/BhriguChat";
import { useI18n, type Language } from "@/lib/i18n";
import { theme } from "@/lib/theme";

type Props = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/", key: "nav.home", fallback: "Home" },
  { href: "/dashboard", key: "nav.dashboard", fallback: "Dashboard" },
  { href: "/analytics-tools", key: "nav.analytics", fallback: "Analytics Tools" },
  { href: "/birth-chart", key: "nav.birthChart", fallback: "Birth Chart" },
  { href: "/nadi-jyotisha", key: "nav.nadiJyotisha", fallback: "Nadi Jyotisha" },
];

function Shell({ children }: Props) {
  const { t, lang, setLang, availableLanguages } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const closeOnResize = () => setMenuOpen(false);
    window.addEventListener("resize", closeOnResize);
    return () => window.removeEventListener("resize", closeOnResize);
  }, []);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(event.target.value as Language);
  };

  const languageToggle = (
    <div className="language-toggle">
      <label className="sr-only" htmlFor="language-select">
        {t("nav.language", "Language")}
      </label>
      <select
        id="language-select"
        value={lang}
        onChange={handleLanguageChange}
        aria-label={t("nav.language", "Language")}
      >
        {availableLanguages.map((option) => (
          <option key={option.code} value={option.code}>
            {option.nativeLabel}
          </option>
        ))}
      </select>
    </div>
  );

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
        <div className="topbar__mobile">
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
          {languageToggle}
          <Link className="button-link soft" href="/dashboard">
            {t("nav.cta", "Open dashboard")}
          </Link>
        </div>
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
          {languageToggle}
          <Link className="button-link soft" href="/dashboard">
            {t("nav.cta", "Open dashboard")}
          </Link>
        </div>
      </header>

      <main id="main" className="page-shell" tabIndex={-1}>
        {children}
      </main>

      <aside className="chat-dock" data-bhrigu-chat aria-label="Bhrigu Samhita chat dock">
        <BhriguChat />
      </aside>

      <footer className="footer" aria-label="Footer">
        <div>
          <p className="eyebrow">BhriguWelt</p>
          <h3>{t("nav.tagline", "Focused tools, calm presentation.")}</h3>
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
