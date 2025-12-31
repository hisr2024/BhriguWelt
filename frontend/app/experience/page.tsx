import Link from "next/link";

export default function ExperiencePage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Experience</p>
        <h1>Experience</h1>
        <p className="muted">A calm overview.</p>
      </div>
      <Link href="/dashboard" className="button-link soft">
        Back to dashboard
      </Link>
    </section>
  );
}
