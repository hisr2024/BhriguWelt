import Link from "next/link";
import MatchmakingForm from "@/components/MatchmakingForm";

export default function MatchmakingPage() {
  return (
    <div className="stack">
      <header className="panel softly">
        <p className="eyebrow">Matchmaking</p>
        <h1>Enter two records, see the compatibility.</h1>
        <p className="muted">Inputs on the left, combined results on submit. Nothing else.</p>
        <div className="hero-actions">
          <Link href="/" className="button-link ghost-link">
            Back
          </Link>
        </div>
      </header>

      <section className="card highlight" aria-label="Matchmaking form">
        <div className="section-heading">
          <h2>Data input</h2>
          <p className="muted">Fill both profiles and submit to view compatibility and remedies.</p>
        </div>
        <MatchmakingForm />
      </section>
    </div>
  );
}
