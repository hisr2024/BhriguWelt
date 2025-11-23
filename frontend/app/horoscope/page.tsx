'use client';

import Link from "next/link";
import HoroscopeForm from "@/components/HoroscopeForm";
import { helperCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";

export default function HoroscopePage() {
  const { t } = useI18n();
  const helperText = helperCopy.horoscope;

  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Horoscope • Panchanga aligned</p>
        <h1>{t("pages.horoscope.title", "Holistic horoscope with only four essentials.")}</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          {t(
            "form.helper",
            helperText ??
              "Name, date of birth, time of birth, and place of birth are all that is needed for a calm, Bhrigu-first reading."
          )}
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
        </div>
      </div>

      <section className="card-grid">
        <div className="card highlight">
          <div className="section-heading">
            <p className="eyebrow">Live experience</p>
            <h2>Holistic horoscope</h2>
            <p>Enter name, date, time, and place for a Bhrigu-anchored reading with generous white space.</p>
          </div>
          <HoroscopeForm />
        </div>
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">Core flows</p>
            <h2>Accurate, shareable readings</h2>
          </div>
          <ul className="kudos-list">
            <li>
              <span className="badge">Primary inputs</span>
              <span>Name, date of birth, time of birth, and place of birth stay front and center.</span>
            </li>
            <li>
              <span className="badge">Holistic interpretation</span>
              <span>Outputs render in English and Hindi with a reading canvas built for long-form clarity.</span>
            </li>
            <li>
              <span className="badge">Download ready</span>
              <span>Save the interpretation as a PDF from the reading panel without engine jargon.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
