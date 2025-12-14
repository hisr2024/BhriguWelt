import Link from "next/link";
import MatchmakingForm from "@/components/MatchmakingForm";
import OperationalStack from "@/components/OperationalStack";

export default function MatchmakingPage() {
  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Matchmaking • Modern + classical</p>
        <h1>Compatibility without the clutter.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          Bhrigu folios, analyzers, interpreters, and Sarvam AI summaries keep duo guidance precise with remedies on.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
        </div>
      </div>

      <OperationalStack />

      <section className="panel softly" aria-label="Compatibility primer">
        <div className="section-heading">
          <p className="eyebrow">Charts first</p>
          <h2>Two charts, one calm overlay</h2>
          <p className="muted">Generate both charts, then compute the aura overlay with remedies and analysis intact.</p>
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
            <h2>Modern Bhrigu matchmaking</h2>
            <p>Compare two birth records plus a few lifestyle tags.</p>
          </div>
          <MatchmakingForm />
        </div>
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">Operational notes</p>
            <h2>Balanced matches</h2>
          </div>
          <p className="muted">Core wisdom, analyzers, interpreters, and Sarvam AI remain active so remedies and analysis are always present.</p>
        </div>
      </section>
    </div>
  );
}
