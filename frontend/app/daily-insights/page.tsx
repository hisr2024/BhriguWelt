import CoreWisdomPanel from "@/components/CoreWisdomPanel";
import JourneyRail from "@/components/JourneyRail";

export default function DailyInsightsPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Daily insights</p>
        <h1>Daily Insights</h1>
        <p className="muted">Receive daily anchors, practical reminders, and clarity cues.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Daily clarity pulse</h2>
        <p className="muted">Bring fast, focused guidance into your morning ritual.</p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <CoreWisdomPanel
          eyebrow="Daily clarity"
          title="Daily insight generator"
          description="Pull quick, actionable insight cards from the core wisdom engine."
          focusAreas={["daily", "clarity", "ritual"]}
        />
      </div>
    </section>
  );
}
