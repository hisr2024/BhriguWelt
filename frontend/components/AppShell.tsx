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

const flowLinks = [
  { href: "#birth-details", label: "Birth details", meta: "Date • Time • Location", glyph: "◎" },
  { href: "#calendar-conversion", label: "Bharat calendar", meta: "Śaka ready", glyph: "↔" },
  { href: "#chart-houses", label: "12 houses", meta: "Radial grid", glyph: "◯" },
  { href: "#insights", label: "Insights", meta: "Today • Week • Month", glyph: "✧" },
  { href: "#timelines", label: "Timelines", meta: "Dashas + transits", glyph: "➜" },
  { href: "#matchmaking", label: "Matchmaking", meta: "Compatibility", glyph: "∞" },
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
  const dockDates = [
    { label: "Next transit", value: "Guru → Kumbha", meta: "2 days" },
    { label: "Śaka tithi", value: "Dwadashi", meta: "Moonlit teal" },
    { label: "Remedy", value: "Sandal dhup", meta: "Today" },
  ];

  const quickActions = [
    { label: "Share", desc: "Send a calm PDF" },
    { label: "Save", desc: "Bookmark seeker" },
    { label: "Consult", desc: "Schedule guide" },
  ];

  return (
    <>
      <a href="#main" className="skip-link">
        {t("nav.skip", "Skip to content")}
      </a>
      <div className="bg-aurora" aria-hidden />
      <div className="bg-celestial" aria-hidden />
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
      <main id="main" className="page-wrapper" tabIndex={-1}>
        <div className="shell-grid">
          <aside className="nav-rail" aria-label="Journey navigation">
            <p className="rail-label">
              <span aria-hidden>☼</span> Core flows
            </p>
            {flowLinks.map((flow) => (
              <Link key={flow.href} href={flow.href} className="rail-link">
                <span className="rail-icon" aria-hidden>
                  {flow.glyph}
                </span>
                <span className="rail-meta">
                  <strong>{flow.label}</strong>
                  <small>{flow.meta}</small>
                </span>
              </Link>
            ))}
            <p className="rail-label">
              <span aria-hidden>✦</span> Quick jumps
            </p>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rail-link">
                <span className="rail-icon" aria-hidden>
                  ↗
                </span>
                <span className="rail-meta">
                  <strong>{t(link.key, link.fallback)}</strong>
                  <small>Page</small>
                </span>
              </Link>
            ))}
          </aside>

          <div className="content-area">{children}</div>

          <aside className="context-dock" aria-label="Context dock">
            <div className="dock-card">
              <h4>Engine highlights</h4>
              <p className="muted" style={{ margin: "0 0 0.5rem" }}>
                Each flow returns accurate English and Hindi guidance you can export as PDF, keeping families and teams aligned.
              </p>
              <div className="pill-row" aria-label="Live states">
                <span className="pill">Bilingual</span>
                <span className="pill">PDF ready</span>
                <span className="pill">Precision tuned</span>
              </div>
            </div>

            <div className="dock-card" aria-label="Key dates">
              <h4>Key dates</h4>
              <ul className="dock-list">
                {dockDates.map((date) => (
                  <li key={date.label}>
                    <div>
                      <strong>{date.label}</strong>
                      <p className="muted">{date.value}</p>
                    </div>
                    <span className="pill">{date.meta}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="dock-card" aria-label="Quick actions">
              <h4>Quick actions</h4>
              <div className="quick-actions">
                {quickActions.map((action) => (
                  <button key={action.label} type="button" className="ghost-button" style={{ width: "100%" }}>
                    <div className="quick-meta">
                      <span>{action.label}</span>
                      <small>{action.desc}</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
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
