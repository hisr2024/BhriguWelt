import JourneyRail from "@/components/JourneyRail";
import MatchmakingForm from "@/components/MatchmakingForm";

export default function MatchmakingPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Matchmaking</p>
        <h1>Matchmaking</h1>
        <p className="muted">Pair two charts and receive a detailed compatibility snapshot.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Compatibility Snapshot</h2>
        <p className="muted">Compare two charts and surface harmony indicators.</p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <MatchmakingForm />
      </div>
    </section>
  );
}
