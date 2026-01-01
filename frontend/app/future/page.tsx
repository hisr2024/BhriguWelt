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
        <h2>Future Trajectory Analysis</h2>
        <p className="muted">
          Forward-looking predictions for your life path. Year-wise and phase-wise guidance
          based purely on future planetary transits and Bhrigu predictive principles.
        </p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <div className="panel__content--stacked">
          <PredictionForm
            engine="future"
            title="Future Outlook Predictions"
            description="Generate year-wise predictions and upcoming life milestones. This analysis is strictly forward-looking with no past-life references."
          />
        </div>
      </div>
    </section>
  );
}
