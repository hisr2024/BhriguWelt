'use client';

import Link from "next/link";
import HoroscopeForm from "@/components/HoroscopeForm";
import ErrorBoundary from "@/components/ErrorBoundary";
import { horoscopeSigns } from "@/lib/horoscopeStatic";
import { useI18n } from "@/lib/i18n";

export default function HoroscopePage() {
  const { t } = useI18n();

  return (
    <div className="stack">
      <header className="panel softly">
        <p className="eyebrow">Horoscope</p>
        <h1>{t("pages.horoscope.title", "Clean form. Complete reading.")}</h1>
        <p className="muted">
          {t(
            "form.helper",
            "Provide the essentials and receive the full horoscope output in one step.",
          )}
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link ghost-link">
            Back
          </Link>
        </div>
      </header>

      <section className="card highlight" aria-label="Horoscope form">
        <div className="section-heading">
          <h2>Data input</h2>
          <p className="muted">All required fields are here. Submit to view the reading.</p>
        </div>
        <ErrorBoundary>
          <HoroscopeForm />
        </ErrorBoundary>
      </section>

      <section className="card" aria-label="Static horoscopes">
        <div className="section-heading">
          <h2>Static horoscopes</h2>
          <p className="muted">Cached hourly with ISR, delivered at the edge.</p>
        </div>
        <div className="alignment-tags">
          {horoscopeSigns.map((sign) => (
            <Link key={sign} href={`/horoscope/${sign}`} className="tag-chip">
              {sign}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
