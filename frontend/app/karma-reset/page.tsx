import JourneyRail from "@/components/JourneyRail";
import PredictionForm from "@/components/PredictionForm";

export default function KarmaResetPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Karma Reset</p>
        <h1>Karma Reset</h1>
        <p className="muted">Generate a karmic dashboard with hotspots, gifts, and reset steps.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Karmic Dashboard</h2>
        <p className="muted">Identify hotspots and receive guided reset assignments.</p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <PredictionForm
          engine="karmic-dashboard"
          title="Karma reset dashboard"
          description="Capture birth details to surface karmic hotspots, gifts, and restorative assignments."
        />
      </div>
    </section>
  );
}
