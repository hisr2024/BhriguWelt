import Link from "next/link";
import MatchmakingForm from "@/components/MatchmakingForm";

export default function MatchmakingPage() {
  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Matchmaking • Modern + classical</p>
        <h1>Compatibility that layers dual charts into a glowing overlay.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          Pair the manuscript lens with simple filters so every duo receives clear guidance. Two charts are required before
          cosmic energies blend into the shared aura.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
        </div>
      </div>

      <section className="panel softly" aria-label="Compatibility primer">
        <div className="section-heading">
          <p className="eyebrow">Charts first</p>
          <h2>Two charts, one calm overlay</h2>
          <p className="muted">
            Generate both charts before computing aura overlays. Duo-chart comparisons highlight Venus–Mars synergies and
            lifestyle tags in color-coded auras.
          </p>
        </div>
        <div className="duo-chart-hint" role="list">
          <div className="duo-chart-hint__card" role="listitem">
            <span className="pill">Aura</span>
            <p>Layered cosmic energies blend into a Venn-style glow for quick reads.</p>
          </div>
          <div className="duo-chart-hint__card" role="listitem">
            <span className="pill">Validation</span>
            <p>Form hints enforce date, time, place, and tags before compatibility renders.</p>
          </div>
          <div className="duo-chart-hint__card" role="listitem">
            <span className="pill">Share</span>
            <p>Export duo overlays as cards or send via chat without leaving the flow.</p>
          </div>
        </div>
      </section>

      <section className="card-grid">
        <div className="card highlight">
          <div className="section-heading">
            <p className="eyebrow">Live experience</p>
            <h2>Modern MindVibe matchmaking</h2>
            <p>Compare two birth records plus a few lifestyle tags.</p>
          </div>
          <MatchmakingForm />
        </div>
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">Engine focus</p>
            <h2>Balanced matches</h2>
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
