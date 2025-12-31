'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import Providers from "@/app/providers";
import { useI18n } from "@/lib/i18n";
import { theme } from "@/lib/theme";

type Props = {
  children: React.ReactNode;
};

const navLinks = [
  { href: "/", key: "nav.home", fallback: "Home" },
  { href: "/dashboard", key: "nav.dashboard", fallback: "Dashboard" },
];

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
          <Link className="button-link soft" href="/dashboard">
            {t("nav.cta", "Open dashboard")}
          </Link>
        </div>
      </header>

      <main id="main" className="page-shell" tabIndex={-1}>
        {children}
      </main>

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
