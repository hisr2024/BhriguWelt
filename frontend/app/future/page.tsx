import Link from "next/link";

export default function FuturePage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Future</p>
        <h1>Future</h1>
        <p className="muted">Short, calm guidance.</p>
      </div>
      <Link href="/dashboard" className="button-link soft">
        Back to dashboard
      </Link>
    </section>
  );
}
