'use client';

export function JourneyRail() {
  return (
    <section className="journey-rail" aria-label="Guided Jyotish journey">
      <div className="section-heading">
        <p className="eyebrow">Story-like flow</p>
        <h2>Birth input → chart → interpretations → timelines</h2>
        <p className="muted">Gentle animations, tooltips, and glossary entries keep new users confident.</p>
      </div>
      <div className="journey-rail__steps">
        <details className="journey-rail__step" open>
          <summary>
            <span className="pill">1</span>
            <div>
              <strong>Gather inputs</strong>
              <p className="microcopy">Form hints explain tithi, nakshatra, and bhava in plain language.</p>
            </div>
          </summary>
          <p className="muted">Auto-validations and timezone nudges keep the data precise.</p>
        </details>
        <details className="journey-rail__step">
          <summary>
            <span className="pill">2</span>
            <div>
              <strong>Render chart wheels</strong>
              <p className="microcopy">Kundli wheels glow softly; hover or tap to reveal micro-interpretations.</p>
            </div>
          </summary>
          <p className="muted">Graphics are lazy-loaded for performance and mobile friendliness.</p>
        </details>
        <details className="journey-rail__step">
          <summary>
            <span className="pill">3</span>
            <div>
              <strong>Explore timelines</strong>
              <p className="microcopy">Horizontal nodes expand to show dasha, transit, and remedy prompts.</p>
            </div>
          </summary>
          <p className="muted">Progress indicators and badges show what data powered each insight.</p>
        </details>
      </div>
    </section>
  );
}
