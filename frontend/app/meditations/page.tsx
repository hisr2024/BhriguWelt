import CoreWisdomPanel from "@/components/CoreWisdomPanel";
import JourneyRail from "@/components/JourneyRail";

export default function MeditationsPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Meditations</p>
        <h1>Meditations</h1>
        <p className="muted">Build calming practices that align with your chart and timing.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Guided stillness</h2>
        <p className="muted">Receive meditation prompts rooted in lunar and planetary focus areas.</p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <CoreWisdomPanel
          eyebrow="Meditation flow"
          title="Meditation guidance"
          description="Shape breathwork and focus themes using your core chart layers."
          focusAreas={["meditation", "breathwork", "stillness"]}
        />
      </div>
    </section>
  );
}
