'use client';

import Link from "next/link";
import HoroscopeForm from "@/components/HoroscopeForm";
import { helperCopy } from "@/lib/copy";
import { useI18n } from "@/lib/i18n";

export default function HoroscopePage() {
  const { t } = useI18n();
  const helperText = helperCopy.horoscope;
  const operationalBlocks = [
    {
      title: "Bhrigu analyzers",
      description: "Processes Śaka-synced birth details into rashi and bhava charts with manuscript discipline.",
    },
    {
      title: "Designers",
      description: "Shapes the house focuses and dasha timelines into a clear operational brief ready for sharing.",
    },
    {
      title: "Interpreters",
      description: "Generate predictions straight from the Saṁhitā wisdom with no filler text or unused widgets.",
    },
  ];

  return (
    <div className="horo-shell">
      <header className="horo-hero">
        <div className="horo-hero__copy">
          <p className="eyebrow">Bhrigu Saṁhitā horoscopes</p>
          <h1>{t("pages.horoscope.title", "Operational predictions without clutter.")}</h1>
          <p className="muted horo-hero__lede">
            {t(
              "form.helper",
              helperText ?? "Śaka calendar inputs, Bhrigu analyzers, and interpreters work together—only active tools remain.",
            )}
          </p>
          <div className="horo-hero__pills">
            <span className="pill">Name</span>
            <span className="pill">Date</span>
            <span className="pill">Time</span>
            <span className="pill">Place</span>
          </div>
          <div className="hero-actions" style={{ gap: "12px", flexWrap: "wrap" }}>
            <Link href="/" className="button-link ghost-link">
              Back
            </Link>
            <Link href="/calendar" className="button-link">
              Refresh Śaka calendar
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
            <h3>Analyse</h3>
          </div>
          <div className="step-card">
            <p className="pill">3</p>
            <h3>Interpret</h3>
          </div>
        </div>
      </header>

      <section className="horo-explorer" aria-label="Operational modules">
        <div className="horo-explorer__controls">
          <div>
            <p className="eyebrow">Active stack</p>
            <p className="microcopy">
              The only items kept here are the ones generating predictions. Everything else was removed to keep the
              Saṁhitā workflow stable.
            </p>
          </div>
          <div className="story-chip">Śaka calendar details travel here automatically after you convert them.</div>
        </div>

        <div className="horo-explorer__grid" role="list">
          {operationalBlocks.map((block) => (
            <div key={block.title} className="horo-explorer__card active" role="listitem" aria-label={block.title}>
              <span className="badge">{block.title}</span>
              <p className="muted">{block.description}</p>
            </div>
          ))}
        </div>
      </section>

      <HoroscopeForm />
    </div>
  );
}
