import JourneyRail from "@/components/JourneyRail";
import PredictionForm from "@/components/PredictionForm";

export default function BirthChartPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Birth chart</p>
        <h1>Birth Chart</h1>
        <p className="muted">Generate rashi and bhava charts with interpretations and dasha anchors.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Chart foundation</h2>
        <p className="muted">Build the full natal map that powers every other experience.</p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <PredictionForm
          engine="horoscope"
          title="Birth chart"
          description="Capture birth details to render charts, dashas, and core interpretations."
        />
      </div>
    </section>
  );
}
