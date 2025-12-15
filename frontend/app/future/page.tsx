import Link from "next/link";
import PredictionForm from "@/components/PredictionForm";

export default function FuturePage() {
  return (
    <div className="stack">
      <header className="panel softly">
        <p className="eyebrow">Future directives</p>
        <h1>Just the inputs and the roadmap.</h1>
        <p className="muted">Submit once to get the next steps and remedies—no extra visuals.</p>
        <div className="hero-actions">
          <Link href="/" className="button-link ghost-link">
            Back
          </Link>
        </div>
      </header>

      <section className="card highlight" aria-label="Future directives">
        <div className="section-heading">
          <h2>Data input</h2>
          <p className="muted">Enter the required fields to view the directive output.</p>
        </div>
        <PredictionForm engine="future" title="Future directives" description="Lean form with direct results." />
      </section>
    </div>
  );
}
