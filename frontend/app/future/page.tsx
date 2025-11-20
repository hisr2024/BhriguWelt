import Link from "next/link";
import PredictionForm from "@/components/PredictionForm";

export default function FuturePage() {
  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Future • Directive-first</p>
        <h1>Build actionable roadmaps that still honor the Bhrigu canon.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          Finance, devotion, service, and health recommendations come back as structured JSON so you can style progress bars,
          streaks, or habit loops for any audience.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
          <span className="badge">Ready for dashboards & mobile streaks</span>
        </div>
      </div>

      <section className="card-grid">
        <div className="card highlight">
          <div className="section-heading">
            <p className="eyebrow">Live experience</p>
            <h2>Future directives</h2>
            <p>Chart the manuscript-backed steps to take next—no extra mapping required.</p>
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
              <span className="badge">Gen Z</span>
              <span>Animated gradients, streak counters, and badge drops keep them engaged.</span>
            </li>
            <li>
              <span className="badge">Professionals</span>
              <span>Minimal JSON-ready outputs for clean dashboards and progress reviews.</span>
            </li>
            <li>
              <span className="badge">Family</span>
              <span>Readable copy and spacious layouts translate well to tablets and web.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
