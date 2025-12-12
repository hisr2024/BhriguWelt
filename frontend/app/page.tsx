'use client';

import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();

  const heroTitle = t("home.heroTitle", "Gen Z cosmic studio with sacred discipline.");
  const heroDescription = t(
    "home.heroDescription",
    "Crafted by Bhrigu Samhita professors and stack engineers to feel alive, neon-soft, and ritual true. Home stays serene; engines now live in focused multi-page labs.",
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
                Welcome to BhriguWelt. This space keeps the introductions upfront so visitors can focus on the story
                before exploring the studios and experiences.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
