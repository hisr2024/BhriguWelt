'use client';

import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();

  const heroTitle = t("home.heroTitle", "Bhrigu Saṁhitā guidance, made contemporary.");
  const heroDescription = t(
    "home.heroDescription",
    "Drawn from authentic Bhrigu Saṁhitā traditions and engineered for clarity. This hub gives you the lineage story first, then routes you to the focused engines.",
  );

  const introductionCards = [
    {
      eyebrow: "Lineage first",
      title: "A calm doorway into ancient Bharat wisdom",
      description:
        "Walk through the quiet glow of ṛṣi Bhrigu's manuscripts, why the palm-leaf codices travelled, and how every śloka is respected before the digital re-imagination begins.",
      accent: "Pamphlets to pulse",
    },
    {
      eyebrow: "Bhrigu Saṁhitā decoded",
      title: "The questions the sages expected you to ask",
      description:
        "Understand the archetypes encoded for seekers: the karmic knots, the remedies that soften them, and the rare counsel that sits between fate and free will.",
      accent: "Karma maps",
    },
    {
      eyebrow: "Interactive by intent",
      title: "Minimal motion, meaningful signals",
      description:
        "Hover to reveal sutras, follow the orbits to sense the lineage, and keep the attention on the silence between words—the design stays out of the way so the wisdom can speak.",
      accent: "Gentle interactivity",
    },
  ];

  const ritualMoments = [
    {
      title: "Samhitā stream",
      detail: "Living introductions, crafted in English yet echoing Sanskrit cadence, to set the mood before predictions.",
    },
    {
      title: "Jyotish atelier",
      detail: "Studio pathways for dashboards, calendars, and matchmaking, each grounded in the same origin story.",
    },
    {
      title: "Remedy track",
      detail: "Whispered upāyas framed as mindful actions—no clutter, just the essential steps.",
    },
  ];

  return (
    <div className="z-shell">
      <section className="z-hero z-hero--cosmic" aria-labelledby="hero-title">
        <div className="z-hero__grid">
          <div className="z-hero__copy">
            <span className="z-pill">Bhrigu Saṁhitā aligned</span>
            <h1 id="hero-title">{heroTitle}</h1>
            <p>{heroDescription}</p>

            <div className="hero-actions">
              <a className="button-link" href="#introduction">
                Begin the introduction
              </a>
              <div className="mantra-chip" aria-label="Bhrigu invocation">
                ॐ नमो भगवते भृगवे
              </div>
            </div>

            <div className="introduction-card introduction-card--glow">
              <p className="eyebrow">Introductions</p>
              <p className="muted">
                The new Home canvas quietly tells the origin of the manuscripts, the ṛṣi lineage, and the disciplines we
                honour before any dashboard or studio session. It is designed to invite, not overwhelm, with subtle
                motion and tactile hovers.
              </p>
            </div>
          </div>

          <div className="wisdom-orbit" aria-hidden>
            <div className="wisdom-orbit__halo" />
            <div className="wisdom-orbit__ring wisdom-orbit__ring--outer" />
            <div className="wisdom-orbit__ring wisdom-orbit__ring--inner" />
            <div className="wisdom-orbit__pulse" />
            <div className="wisdom-orbit__glyph">भृ</div>
            <div className="wisdom-orbit__spark wisdom-orbit__spark--one" />
            <div className="wisdom-orbit__spark wisdom-orbit__spark--two" />
            <div className="wisdom-orbit__spark wisdom-orbit__spark--three" />
            <p className="orbit-caption">Ancient cadence translated into a living digital ālaya.</p>
          </div>
        </div>
      </section>

      <section id="introduction" className="introduction-grid" aria-label="Bhrigu introduction">
        <div className="section-heading">
          <p className="eyebrow">Living preface</p>
          <h2>Enter softly; the Saṁhitā story leads.</h2>
          <p className="muted">
            Each card is a luminous tile that reveals the Bhrigu perspective with minimal movement. Hover or focus to
            watch the ābhā (glow) breathe.
          </p>
        </div>

        <div className="wisdom-grid">
          {introductionCards.map((card) => (
            <article key={card.title} className="wisdom-card">
              <div className="wisdom-card__halo" />
              <p className="eyebrow">{card.eyebrow}</p>
              <h3>{card.title}</h3>
              <p className="muted">{card.description}</p>
              <div className="wisdom-card__accent">{card.accent}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="ritual-lattice" aria-label="Experience flow">
        <div className="section-heading">
          <p className="eyebrow">Interactive calm</p>
          <h2>Minimalist motion that still feels sacred.</h2>
          <p className="muted">
            The Home page breathes with gentle gradients, orbital glyphs, and micro-interactions that mirror the heartbeat
            of the Bhrigu manuscripts.
          </p>
        </div>

        <div className="ritual-lattice__grid">
          {ritualMoments.map((moment) => (
            <div key={moment.title} className="ritual-card">
              <div className="ritual-card__orb" />
              <div className="ritual-card__content">
                <h3>{moment.title}</h3>
                <p className="muted">{moment.detail}</p>
              </div>
              <span className="ritual-card__pulse" aria-hidden />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
