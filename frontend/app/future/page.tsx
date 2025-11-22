import Link from "next/link";
import PredictionForm from "@/components/PredictionForm";

export default function FuturePage() {
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
            <p className="eyebrow">Delivery ideas</p>
            <h2>Design for every age group</h2>
          </div>
          <ul className="kudos-list">
            <li>
              <span className="badge">Youthful energy</span>
              <span>Use playful counters when needed, but keep text readable.</span>
            </li>
            <li>
              <span className="badge">Professionals</span>
              <span>Human-readable outputs for clean dashboards.</span>
            </li>
            <li>
              <span className="badge">Family</span>
              <span>Readable copy and spacious layouts for tablets and web.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
