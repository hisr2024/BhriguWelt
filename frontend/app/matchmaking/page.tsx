import Link from "next/link";
import MatchmakingForm from "@/components/MatchmakingForm";

export default function MatchmakingPage() {
  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Matchmaking • Modern + classical</p>
        <h1>Compatibility scoring that respects guna and lifestyle tags.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          Pair Bhrigu Samhita manuscripts with modern filters like remote-first, creator economy, or adventure-aligned so every duo receives nuanced, language-rich guidance.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
          <span className="badge">Balanced for web and native modals</span>
        </div>
      </div>

      <section className="card-grid">
        <div className="card highlight">
          <div className="section-heading">
            <p className="eyebrow">Live experience</p>
            <h2>Modern Bhrigu matchmaking</h2>
            <p>Compare two complete Bhrigu Samhita birth records plus contemporary lifestyle tags.</p>
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
              <span>Use it to generate compatibility cards for celebrations and invite flows.</span>
            </li>
            <li>
              <span className="badge">Co-labs</span>
              <span>Tag preferences like research-partnership or artistic collab for nuanced matches.</span>
            </li>
            <li>
              <span className="badge">Mobile friendly</span>
              <span>Form sections stack gracefully and keep CTA buttons thumb-accessible.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
