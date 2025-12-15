'use client';

import Link from "next/link";
import "./styles/home-minimal.css";

import { useI18n } from "@/lib/i18n";

const signatureBeams = [
  "Śaka native intelligence",
  "Bilingual clarity by default",
  "Studio-grade craft without clutter",
];

export default function HomePage() {
  const { t } = useI18n();

  return (
    <div className="intro-shell">
      <section className="intro-grid" aria-labelledby="intro-title">
        <div className="logo-column" aria-hidden>
          <div className="logo-crest">
            <div className="logo-glow" />
            <div className="logo-ring ring-one" />
            <div className="logo-ring ring-two" />
            <div className="logo-ring ring-three" />
            <div className="logo-core">
              <span className="logo-core__halo" />
              <span className="logo-core__glyph">BW</span>
            </div>
            <div className="logo-spark" />
            <div className="logo-spark delay" />
          </div>
        </div>

        <div className="intro-copy">
          <p className="eyebrow">BhriguWelt</p>
          <h1 id="intro-title">
            {t("hero.title", "A minimal, world-class jyotish home")}
          </h1>
          <p className="muted intro-lede">
            {t(
              "hero.body",
              "Quiet mastery for horoscope, matchmaking, and future journeys—crafted with precision graphics, elegant motion, and nothing extra."
            )}
          </p>

          <div className="intro-actions">
            <Link className="button-link" href="/studio">
              {t("nav.cta", "Enter the studio")}
            </Link>
            <Link className="ghost-button" href="/dashboard">
              {t("nav.dashboard", "View dashboard")}
            </Link>
          </div>

          <div className="signature-grid" role="list">
            {signatureBeams.map((beam) => (
              <div className="signature-chip" key={beam} role="listitem">
                <span className="chip-dot" aria-hidden />
                <span>{beam}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
