import Link from "next/link";
import PredictionForm from "@/components/PredictionForm";

export default function PastLifePage() {
  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Past-life • Folio referenced</p>
        <h1>Surface reincarnation arcs with manuscript rigor.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          Invite seekers to explore prior epochs and karmic lessons in story form without technical clutter.
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
            <h2>Past-life excavation</h2>
            <p>Trace eras, lessons, and remedies with the same validated inputs used in the horoscope engine.</p>
          </div>
          <PredictionForm
            engine="past-life"
            title="Past-life excavation"
            description="Great for story-driven timelines, profile badges, and loyalty rewards."
          />
        </div>
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">Why it resonates</p>
            <h2>Classical insight for every generation</h2>
          </div>
          <ul className="kudos-list">
            <li>
              <span className="badge">Scroll friendly</span>
              <span>Looks sharp inside mobile app webviews and landing pages.</span>
            </li>
            <li>
              <span className="badge">Shareable stories</span>
              <span>Drop the response into cards, chat, or push notifications with English and Hindi side by side.</span>
            </li>
            <li>
              <span className="badge">Same validation</span>
              <span>Tithi, elements, and houses are enforced here too.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
