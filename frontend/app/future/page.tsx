import Link from "next/link";
import Timeline from "@/components/Timeline";
import PredictionForm from "@/components/PredictionForm";

export default function FuturePage() {
  const events = [
    {
      title: "Transit glow",
      window: "Next 6 months",
      houseAnchor: "House 4 • Roots",
      detail: "Home rituals and study sprints anchor this phase; hover for remedy prompts.",
      icon: "🏡",
    },
    {
      title: "Dasha shift",
      window: "2025",
      houseAnchor: "House 9 • Dharma",
      detail: "Scholarship streaks, pilgrimages, and mentorship checklists surface automatically.",
      icon: "📜",
    },
    {
      title: "Partnership bloom",
      window: "2026",
      houseAnchor: "House 7 • Partnerships",
      detail: "Shared service and travel markers light up; progress bars show karma resolution.",
      icon: "🤝",
    },
  ];

  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Future • Directive-first</p>
        <h1>Actionable roadmaps that still honor the Bhrigu canon.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          Finance, devotion, service, and health recommendations return as flowing interpretations you can read aloud.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
        </div>
      </div>

      <section className="panel softly" aria-label="Future timeline overlay">
        <div className="section-heading">
          <p className="eyebrow">Timeline</p>
          <h2>Scroll through phases</h2>
          <p className="muted">Interactive milestones stay linked to the foundational twelve houses.</p>
        </div>
        <Timeline events={events} accent="pink" />
        <div className="microcopy">Drag to fast-forward; haptic cues pulse when major shifts approach.</div>
      </section>

      <section className="card-grid">
        <div className="card highlight">
          <div className="section-heading">
            <p className="eyebrow">Live experience</p>
            <h2>Future directives</h2>
            <p>Chart the manuscript-backed steps to take next in English and Hindi.</p>
          </div>
          <PredictionForm
            engine="future"
            title="Future directives"
            description="Use this as the feed source for timelines, notifications, and profile streaks."
          />
        </div>
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">Engine focus</p>
            <h2>Guidance you can share</h2>
          </div>
          <ul className="kudos-list">
            <li>
              <span className="badge">Bilingual</span>
              <span>English and Hindi outputs keep families and teams aligned.</span>
            </li>
            <li>
              <span className="badge">PDF ready</span>
              <span>Export interpretations as PDFs for timelines or notifications.</span>
            </li>
            <li>
              <span className="badge">Accurate</span>
              <span>Field-level alignment keeps remedies and recommendations precise.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
