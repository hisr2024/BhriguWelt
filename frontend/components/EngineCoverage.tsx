"use client";

import Link from "next/link";

const engines = [
  {
    label: "Past lives & karma soul journeys",
    eyebrow: "Healing arcs",
    description: "Folios surface riverbank vows, karma soul journeys, and sutra cues with ready-to-download reports.",
    href: "/past-life",
  },
  {
    label: "Future predictions",
    eyebrow: "Directive rail",
    description: "Timelines, remedies, and trajectories auto-export into PDFs for councils or mentors.",
    href: "/future",
  },
  {
    label: "Horoscopes & journeys",
    eyebrow: "Karmic cadence",
    description: "Birth charts, epochs, and remedies render with bilingual notes and PDF proof for seekers.",
    href: "/horoscope",
  },
  {
    label: "Matchmaking",
    eyebrow: "Compat clarity",
    description: "Compatibility wheels, shared rituals, and modern preferences arrive with shareable PDF dossiers.",
    href: "/matchmaking",
  },
];

export default function EngineCoverage() {
  return (
    <section className="panel softly engine-coverage" aria-label="Engine readiness">
      <div className="section-heading">
        <p className="eyebrow">Engine readiness</p>
        <h2>Every engine returns results with PDF receipts.</h2>
        <p className="muted">
          Past lives, future directives, horoscopes, karma soul journeys, and matchmaking reports now render in-line and
          download as calm, shareable PDFs.
        </p>
      </div>
      <div className="engine-coverage__grid">
        {engines.map((engine) => (
          <article key={engine.label} className="engine-coverage__card">
            <p className="pill subtle">{engine.eyebrow}</p>
            <h3>{engine.label}</h3>
            <p className="muted">{engine.description}</p>
            <div className="engine-coverage__actions">
              <span className="microcopy">PDF-ready guidance</span>
              <Link href={engine.href} className="button-link ghost-link">
                View engine
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
