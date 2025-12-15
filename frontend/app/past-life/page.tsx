import Link from "next/link";
import PredictionForm from "@/components/PredictionForm";

export default function PastLifePage() {
  return (
    <div className="stack">
      <header className="panel softly">
        <p className="eyebrow">Past lives</p>
        <h1>Input once. Read the narratives immediately.</h1>
        <p className="muted">Birth details in, sutra-backed stories and remedies out. Nothing extra.</p>
        <div className="hero-actions">
          <Link href="/" className="button-link ghost-link">
            Back
          </Link>
        </div>
      </header>

      <section className="card highlight" aria-label="Past-life analysis">
        <div className="section-heading">
          <h2>Data input</h2>
          <p className="muted">Fill the essentials and submit to render the past-life results.</p>
        </div>
        <PredictionForm engine="past-life" title="Past-life analysis" description="Minimal form, immediate results." />
      </section>
    </div>
  );
}
