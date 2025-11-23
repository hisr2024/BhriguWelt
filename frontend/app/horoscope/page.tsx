'use client';

import Link from "next/link";
import HoroscopeForm from "@/components/HoroscopeForm";
import { helperCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";

export default function HoroscopePage() {
  const { t } = useI18n();
  const helperText = helperCopy.horoscope;

  return (
    <div className="horo-shell">
      <header className="horo-hero">
        <div className="horo-hero__copy">
          <p className="eyebrow">Minimal horoscope</p>
          <h1>{t("pages.horoscope.title", "Direct interpretations. Nothing extra.")}</h1>
          <p className="muted horo-hero__lede">{t("form.helper", helperText ?? "Only the data you enter shows up here.")}</p>
          <div className="horo-hero__pills">
            <span className="pill">Name</span>
            <span className="pill">Date</span>
            <span className="pill">Time</span>
            <span className="pill">Place</span>
          </div>
          <div className="hero-actions">
            <Link href="/" className="button-link ghost-link">
              Back
            </Link>
          </div>
        </div>
        <div className="horo-hero__steps" aria-label="Horoscope flow steps">
          <div className="step-card">
            <p className="pill">1</p>
            <h3>Enter details</h3>
          </div>
          <div className="step-card">
            <p className="pill">2</p>
            <h3>Read</h3>
          </div>
          <div className="step-card">
            <p className="pill">3</p>
            <h3>Share</h3>
          </div>
        </div>
      </header>

      <HoroscopeForm />
    </div>
  );
}
