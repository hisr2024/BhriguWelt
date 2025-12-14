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
      <section className="panel-header" style={{ alignItems: "flex-start", gap: "16px" }}>
        <div>
          <p className="eyebrow">Bhrigu Saṁhitā horoscopes</p>
          <h1>{t("pages.horoscope.title", "Fill in every detail so remedies and rituals stay precise.")}</h1>
          <p className="muted" style={{ maxWidth: "720px" }}>
            {t(
              "form.helper",
              helperText ?? "Śaka calendar inputs move with you—refresh them anytime before generating the PDF-ready reading.",
            )}
          </p>
        </div>
        <div className="hero-actions" style={{ gap: "12px", flexWrap: "wrap" }}>
          <Link href="/" className="button-link ghost-link">
            Back
          </Link>
          <Link href="/calendar" className="button-link">
            Refresh Śaka calendar
          </Link>
        </div>
      </section>

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
