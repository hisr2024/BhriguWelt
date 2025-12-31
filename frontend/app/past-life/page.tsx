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
        <h2>Past-Life Reading</h2>
        <p className="muted">Generate a focused narrative rooted in Bhrigu folios.</p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <PredictionForm
          engine="past-life"
          title="Past-life insights"
          description="Capture birth details to unlock soul memory themes and gentle closure rituals."
        />
      </div>
    </section>
  );
}
