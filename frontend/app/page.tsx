'use client';

import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();

  const heroTitle = t("home.heroTitle", "Bhrigu Saṁhitā guidance, made contemporary.");
  const heroDescription = t(
    "home.heroDescription",
    "Drawn from authentic Bhrigu Saṁhitā traditions and engineered for clarity. This hub gives you the lineage story first, then routes you to the focused engines.",
  );

  return (
    <div className="z-shell">
      <section className="z-hero" aria-labelledby="hero-title">
        <div className="z-hero__grid">
          <div className="z-hero__copy">
            <span className="z-pill">Bhrigu Samhita aligned</span>
            <h1 id="hero-title">{heroTitle}</h1>
            <p>{heroDescription}</p>
            <div className="introduction-card">
              <p className="eyebrow">Introductions</p>
              <p className="muted">
                Welcome to BhriguWelt. The opening canvas now explains the origin of the manuscripts, how the ṛṣi
                compiled the Saṁhitā, and how we translate that discipline into today’s tools before you explore any
                studio or engine.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
