'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import Providers from "@/app/providers";
import { useI18n, type Language } from "@/lib/i18n";
import OnboardingModal from "./OnboardingModal";
import ExperienceToolbar from "./ExperienceToolbar";
import { KiaanLogoAnimated } from "./branding/KiaanLogo";
import { MindVibeIcon } from "./branding/MindVibeLogo";

type Props = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/", key: "nav.home", fallback: "Home" },
  { href: "/calendar", key: "nav.calendar", fallback: "Śaka calendar" },
  { href: "/horoscope", key: "nav.horoscope", fallback: "Horoscope" },
  { href: "/past-life", key: "nav.past", fallback: "Past lives" },
  { href: "/future", key: "nav.future", fallback: "Future" },
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

      <OnboardingModal />

      <header className="topbar" aria-label="Site header">
        <Link href="/" className="brand" aria-label={t("nav.home", "Home")}>
          <MindVibeIcon variant="ocean" size={46} badge />
          <div className="brand__wording">
            <strong className="brand__title">KIAAN — MindVibe Companion</strong>
            <span className="brand__tagline">Crisp, calm guidance.</span>
          </div>
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
          <Link className="button-link soft" href="/matchmaking">
            {t("nav.cta", "Start a session")}
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
          <LanguageToggle />
          <KiaanLogoAnimated compact reducedMotion={false} />
          <Link className="button-link soft" href="/matchmaking">
            {t("nav.cta", "Start a session")}
          </Link>
        </div>
      </header>

      <div className="topbar__touch-row" role="group" aria-label={t("nav.quick.label", "Quick jump for forms")}>
        <Link className="touch-chip" href="/experience#birth" aria-label={t("nav.quick.birth", "Birth input section")}>
          {t("nav.quick.birth", "Birth input")}
        </Link>
        <Link className="touch-chip" href="/experience#chart" aria-label={t("nav.quick.chart", "Chart section")}>
          {t("nav.quick.chart", "Chart")}
        </Link>
        <Link className="touch-chip" href="/horoscope" aria-label={t("nav.quick.horoscope", "Interpretations section")}>
          {t("nav.quick.horoscope", "Interpretations")}
        </Link>
        <Link className="touch-chip" href="/matchmaking" aria-label={t("nav.quick.matchmaking", "Matchmaking section")}>
          {t("nav.quick.matchmaking", "Matchmaking")}
        </Link>
      </div>

      <ExperienceToolbar />

      <main id="main" className="page-shell" tabIndex={-1}>
        {children}
      </main>

      <footer className="footer" aria-label="Footer">
        <div>
          <p className="eyebrow">MindVibe Companion</p>
          <h3>{t("nav.tagline", "KIAAN — crisp, calm guidance.")}</h3>
          <p className="muted">{t("nav.desc", "MindVibe keeps every ritual gentle with balanced gradients, soft motion, and Śaka-aware clarity.")}</p>
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
