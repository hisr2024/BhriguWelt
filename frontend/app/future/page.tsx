import JourneyRail from "@/components/JourneyRail";
import PredictionForm from "@/components/PredictionForm";

export default function FuturePage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Future</p>
        <h1>Future</h1>
        <p className="muted">Generate forward-looking guidance and milestone focus areas.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Future Outlook</h2>
        <p className="muted">Generate a focused forecast aligned to your current cycle.</p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <div className="panel__content--stacked">
          <PredictionForm
            engine="future"
            title="Future outlook"
            description="Generate predictions and align next steps with dasha timing."
          />
        </div>
      </div>
    </section>
  );
}
