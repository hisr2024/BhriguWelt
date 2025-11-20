import Link from "next/link";
import CalendarForm from "@/components/CalendarForm";

export default function CalendarPage() {
  return (
    <div className="stack">
      <div className="hero">
        <p className="eyebrow">Śaka calendar • Conversion lab</p>
        <h1>Always anchor onboarding to the Hindu calendar and IST.</h1>
        <p className="muted" style={{ maxWidth: "760px" }}>
          Convert Gregorian birth details into Śaka-aligned payloads before calling any engine. Perfect for mobile form flows
          and international audiences.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
          <span className="badge">IST-referenced outputs</span>
        </div>
      </div>

      <section className="card-grid">
        <div className="card highlight">
          <div className="section-heading">
            <p className="eyebrow">Live experience</p>
            <h2>Gregorian → Śaka converter</h2>
            <p>Use this before invoking horoscope, future, past-life, or matchmaking endpoints.</p>
          </div>
          <CalendarForm />
        </div>
        <div className="card">
          <div className="section-heading">
            <p className="eyebrow">Why it matters</p>
            <h2>Accuracy across devices</h2>
          </div>
          <ul className="kudos-list">
            <li>
              <span className="badge">Consistency</span>
              <span>All predictions align to the same Śaka context your backend expects.</span>
            </li>
            <li>
              <span className="badge">Global-ready</span>
              <span>Great for non-IST users—the converter returns IST in the payload.</span>
            </li>
            <li>
              <span className="badge">UX friendly</span>
              <span>Minimal inputs, high clarity; drop it into any onboarding step.</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
