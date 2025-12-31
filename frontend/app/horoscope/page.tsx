import Link from "next/link";

export default function HoroscopePage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Horoscope</p>
        <h1>Horoscope</h1>
        <p className="muted">Short and clear guidance.</p>
      </div>
      <Link href="/dashboard" className="button-link soft">
        Back to dashboard
      </Link>
    </section>
  );
}
