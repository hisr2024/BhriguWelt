import Link from "next/link";
import MatchmakingForm from "@/components/MatchmakingForm";

export default function MatchmakingPage() {
  return (
    <div className="stack">
      <header className="panel softly">
        <p className="eyebrow">Matchmaking / संगति</p>
        <h1>Enter two charts, reveal layered compatibility.</h1>
        <p className="muted">Both charts are required before the cosmic overlays and cards unlock.</p>
        <div className="hero-actions">
          <Link href="/" className="button-link ghost-link">
            Back
          </Link>
        </div>
      </header>

      <section className="card highlight" aria-label="Matchmaking form">
        <div className="section-heading">
          <h2>Data input / डेटा</h2>
          <p className="muted">Fill both profiles and submit to view compatibility, overlays, and remedies.</p>
        </div>
        <MatchmakingForm />
      </section>
    </div>
  );
}
