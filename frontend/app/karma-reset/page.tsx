import Link from "next/link";

export default function KarmaResetPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Karma Reset</p>
        <h1>Karma Reset</h1>
        <p className="muted">A quiet reset.</p>
      </div>
      <Link href="/dashboard" className="button-link soft">
        Back to dashboard
      </Link>
    </section>
  );
}
