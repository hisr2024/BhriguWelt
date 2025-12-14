'use client';

import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();

  const heroTitle = t("home.heroTitle", "Bhrigu Saṁhitā, quietly current.");
  const heroDescription = t(
    "home.heroDescription",
    "Lineage-led guidance with minimal UI—start at the source, then step into each tool.",
  );

  const introductionCards = [
    {
      eyebrow: "Lineage first",
      title: "A calm doorway to the manuscripts",
      description:
        "Why the palm-leaf codices travelled and how every śloka is held intact before design begins.",
      accent: "Pamphlets to pulse",
    },
    {
      eyebrow: "Bhrigu Saṁhitā decoded",
      title: "Questions the sages expected",
      description:
        "Archetypes, karmic knots, and remedies stated plainly for anyone approaching the Saṁhitā.",
      accent: "Karma maps",
    },
    {
      eyebrow: "Interactive by intent",
      title: "Minimal motion, clear signals",
      description:
        "Soft reveals and simple orbits keep attention on the words while the design stays out of view.",
      accent: "Gentle interactivity",
    },
  ];

  const ritualMoments = [
    {
      title: "Samhitā stream",
      detail: "Short introductions in English that keep the Sanskrit cadence before you dive in.",
    },
    {
      title: "Jyotish atelier",
      detail: "Dashboards, calendars, and matchmaking flows that stay rooted in the same origin story.",
    },
    {
      title: "Remedy track",
      detail: "Upāyas framed as a few mindful actions—no clutter, only the steps you need.",
    },
  ];

  const engineExperiences = [
    {
      title: "Horoscope engine",
      description: "Nakṣatra-aware dashboards that keep the Bhrigu story visible with motion only when it helps.",
      mantra: "Chandra-led calm",
    },
    {
      title: "Matchmaking flow",
      description: "Kuṭumba, karma, and compatibility shown with soft pulses instead of loud alerts.",
      mantra: "Śubha sandhi",
    },
    {
      title: "Past-life trace",
      description: "Lotus-like revealers for previous janmas, balanced by a gentle glow.",
      mantra: "Smaraṇa lotus",
    },
    {
      title: "Calendar atelier",
      description: "Tithi-aware planners that light up the right muhurta bands without cluttering the gaze.",
      mantra: "Muhurta weave",
    },
  ];

  const yantraGlyphs = [
    { label: "ॐ", hint: "Source hum" },
    { label: "क्रि", hint: "Action spark" },
    { label: "ज्ञा", hint: "Sage knowing" },
    { label: "ह्रीं", hint: "Heart beam" },
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
                A quiet preface on the manuscripts, the ṛṣi lineage, and the disciplines we honour before any dashboard.
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
            <p className="orbit-caption">Ancient cadence held in a quiet digital ālaya.</p>
          </div>
        </div>
      </section>

      <section id="introduction" className="introduction-grid" aria-label="Bhrigu introduction">
        <div className="section-heading">
          <p className="eyebrow">Living preface</p>
          <h2>Enter softly; the Saṁhitā story leads.</h2>
          <p className="muted">Each card reveals the Bhrigu view with a soft glow on hover or focus.</p>
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
          <p className="muted">Gentle gradients and micro-interactions echo the calm of the manuscripts.</p>
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

      <section className="engine-weave" aria-label="Engine previews with ancient Indian cues">
        <div className="section-heading">
          <p className="eyebrow">Engines in harmony</p>
          <h2>Minimal UI, deep lineage motion.</h2>
          <p className="muted">Each engine keeps a yantra aura and mantra badge while the animations stay soft.</p>
        </div>

        <div className="engine-grid">
          {engineExperiences.map((engine) => (
            <article key={engine.title} className="engine-card">
              <div className="engine-card__shine" />
              <div className="engine-card__frame" />
              <div className="engine-card__body">
                <p className="eyebrow">{engine.mantra}</p>
                <h3>{engine.title}</h3>
                <p className="muted">{engine.description}</p>
              </div>
              <div className="engine-card__pulse" aria-hidden />
            </article>
          ))}
        </div>

        <div className="yantra-ribbon" aria-label="Animated yantra glyphs">
          <div className="yantra-ribbon__trail" />
          {yantraGlyphs.map((glyph) => (
            <div key={glyph.label} className="yantra-chip" aria-label={glyph.hint}>
              <span className="yantra-chip__glow" aria-hidden />
              <span className="yantra-chip__glyph">{glyph.label}</span>
              <span className="yantra-chip__hint">{glyph.hint}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
