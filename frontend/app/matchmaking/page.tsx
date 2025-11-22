import Link from "next/link";
import MatchmakingForm from "@/components/MatchmakingForm";

export default function MatchmakingPage() {
  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Matchmaking • Modern + classical</p>
        <h1>Compatibility that respects guna and lifestyle tags.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          Pair the manuscript lens with simple filters so every duo receives clear guidance.
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
            <h2>Modern Bhrigu matchmaking</h2>
            <p>Compare two birth records plus a few lifestyle tags.</p>
          </div>
          <MatchmakingForm />
        </div>
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">Best for</p>
            <h2>Dating, weddings, co-founder fits</h2>
          </div>
          <ul className="kudos-list">
            <li>
              <span className="badge">Event ready</span>
              <span>Generate compatibility cards for celebrations and invite flows.</span>
            </li>
            <li>
              <span className="badge">Co-labs</span>
              <span>Tag preferences like research-partnership or artistic collab.</span>
            </li>
            <li>
              <span className="badge">Mobile friendly</span>
              <span>Form sections stack cleanly for thumbs and tablets.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
