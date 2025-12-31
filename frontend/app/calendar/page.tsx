import Link from "next/link";

export default function CalendarPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Calendar</p>
        <h1>Calendar</h1>
        <p className="muted">Simple date support.</p>
      </div>
      <Link href="/dashboard" className="button-link soft">
        Back to dashboard
      </Link>
    </section>
  );
}
