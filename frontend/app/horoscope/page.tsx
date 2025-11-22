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
        <h1>{t("pages.horoscope.title", "Bhrigu Samhita consultations without clutter.")}</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>{t("form.helper", helperText)}</p>
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
            <p>Enter name, date, time, and place for immediate English and Hindi readings.</p>
          </div>
          <HoroscopeForm />
        </div>
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">What you get</p>
            <h2>Modern UX, manuscript strict</h2>
          </div>
          <ul className="kudos-list">
            <li>
              <span className="badge">Citations</span>
              <span>Each output stays in prose with folio references.</span>
            </li>
            <li>
              <span className="badge">Mobile ready</span>
              <span>Form grids collapse neatly for small screens.</span>
            </li>
            <li>
              <span className="badge">API parity</span>
              <span>Fields mirror the backend while returning guidance instead of JSON.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
