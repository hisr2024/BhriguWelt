import Link from "next/link";

export default function MatchmakingPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Matchmaking</p>
        <h1>Matchmaking</h1>
        <p className="muted">Simple compatibility view.</p>
      </div>
      <Link href="/dashboard" className="button-link soft">
        Back to dashboard
      </Link>
    </section>
  );
}
