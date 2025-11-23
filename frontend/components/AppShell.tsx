'use client';

import Link from "next/link";
import Providers from "@/app/providers";
import { useI18n } from "@/lib/i18n";
import OnboardingModal from "./OnboardingModal";
import ExperienceToolbar from "./ExperienceToolbar";

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

      <OnboardingModal />

      <header className="topbar" aria-label="Site header">
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
        <div className="topbar__actions">
          <LanguageToggle />
          <Link className="button-link soft" href="/matchmaking">
            {t("nav.cta", "Start a session")}
          </Link>
        </div>
      </header>

      <ExperienceToolbar />

      <main id="main" className="page-shell" tabIndex={-1}>
        {children}
      </main>

      <footer className="footer" aria-label="Footer">
        <div>
          <p className="eyebrow">Bharat-centred Jyotish</p>
          <h3>{t("nav.tagline", "Quiet guidance across every stage of life.")}</h3>
          <p className="muted">{t("nav.desc", "Readable predictions, Śaka-ready conversions, and heartfelt remedies in one space.")}</p>
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
