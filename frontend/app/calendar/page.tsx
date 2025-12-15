import Link from "next/link";
import CalendarForm from "@/components/CalendarForm";

export default function CalendarPage() {
  return (
    <div className="stack">
      <header className="panel softly">
        <p className="eyebrow">Śaka calendar</p>
        <h1>Convert and export without extras.</h1>
        <p className="muted">Provide birth details, get Śaka-aligned outputs for every engine.</p>
        <div className="hero-actions">
          <Link href="/" className="button-link ghost-link">
            Back
          </Link>
        </div>
      </header>

      <section className="card highlight" aria-label="Śaka converter">
        <div className="section-heading">
          <h2>Data input</h2>
          <p className="muted">Only the required fields remain. Submit to see the conversion result.</p>
        </div>
        <CalendarForm />
      </section>
    </div>
  );
}
