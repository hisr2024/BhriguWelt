'use client';

import Link from "next/link";
import PredictionForm from "@/components/PredictionForm";
import { useI18n } from "@/lib/i18n";

export default function HoroscopePage() {
  const { t } = useI18n();
  const helperCopy =
    "Capture tithi, the five moon elements, and the houses that shape karmic momentum. Each response cites the preserved folios so you can map it directly into mobile onboarding or web dashboards.";

  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Horoscope • Panchanga aligned</p>
        <h1>{t("pages.horoscope.title", "Deep-dive consultations with the full Bhrigu Samhita stack.")}</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          {t("form.helper", helperCopy)}
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
          <span className="badge">Validates tithi 1–30 & moon element options</span>
        </div>
      </div>

      <section className="card-grid">
        <div className="card highlight">
          <div className="section-heading">
            <p className="eyebrow">Live experience</p>
            <h2>Holistic horoscope</h2>
            <p>Blend karmic epoch, remedies, past lives, and future trajectories for a single seeker.</p>
          </div>
          <PredictionForm
            engine="horoscope"
            title="Holistic horoscope"
            description="Perfect for hero modals, waitlist flows, and concierge-style chat handoffs."
          />
        </div>
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">What you get</p>
            <h2>Modern UX, manuscript strict</h2>
          </div>
          <ul className="kudos-list">
            <li>
              <span className="badge">Citations</span>
              <span>Every output is JSON you can store and display with folio references intact.</span>
            </li>
            <li>
              <span className="badge">Mobile ready</span>
              <span>Form grids collapse neatly for small screens and in-app webviews.</span>
            </li>
            <li>
              <span className="badge">API parity</span>
              <span>Fields mirror the Python backend contracts used by Render and Railway.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
