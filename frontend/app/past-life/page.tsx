import JourneyRail from "@/components/JourneyRail";
import PredictionForm from "@/components/PredictionForm";

export default function PastLifePage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Past Life</p>
        <h1>Past Life</h1>
        <p className="muted">Reveal karmic memories with grounded, manuscript-backed insights.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Past-Life + Future Outlook</h2>
        <p className="muted">Connect past-life themes with future directives for a unified reading.</p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <PredictionForm
          engine="past-future"
          title="Past-life insights + future outlook"
          description="Capture birth details to connect karmic echoes with upcoming windows and remedies."
        />
      </div>
    </section>
  );
}
