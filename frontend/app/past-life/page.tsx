import Link from "next/link";

export default function PastLifePage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Past Life</p>
        <h1>Past Life</h1>
        <p className="muted">Simple reflections.</p>
      </div>
      <Link href="/dashboard" className="button-link soft">
        Back to dashboard
      </Link>
    </section>
  );
}
