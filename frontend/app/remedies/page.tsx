import CoreWisdomPanel from "@/components/CoreWisdomPanel";
import JourneyRail from "@/components/JourneyRail";

export default function RemediesPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Remedies</p>
        <h1>Remedies</h1>
        <p className="muted">Personalized rituals drawn from Bhrigu manuscripts and core engines.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Remedy compass</h2>
        <p className="muted">Surface chants, gems, and rituals tailored to your chart.</p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <CoreWisdomPanel
          eyebrow="Remedy compass"
          title="Remedies and ritual guidance"
          description="Pull remedy prescriptions across folios, tuned to your current focus areas."
          focusAreas={["remedies", "rituals", "healing"]}
        />
      </div>
    </section>
  );
}
