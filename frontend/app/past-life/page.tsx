import Link from "next/link";
import PredictionForm from "@/components/PredictionForm";

export default function PastLifePage() {
  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Past-life • Folio referenced</p>
        <h1>Surface reincarnation arcs without losing manuscript rigor.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          Invite seekers to explore their prior epochs and karmic lessons, with JSON you can reuse in carousels, chatbots, or
          push notifications.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
          <span className="badge">Citations travel with the payload</span>
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
            <h2>Gen Z meets classical insight</h2>
          </div>
          <ul className="kudos-list">
            <li>
              <span className="badge">Scroll friendly</span>
              <span>Looks sharp inside mobile app webviews and Instagram-friendly landing pages.</span>
            </li>
            <li>
              <span className="badge">Re-usable JSON</span>
              <span>Drop the response into cards, chat, or push notifications without extra mapping.</span>
            </li>
            <li>
              <span className="badge">Same validation</span>
              <span>Tithi, elements, and houses are enforced here too, so backend parity never drifts.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
