import MeditationPanel from "@/components/MeditationPanel";
import JourneyRail from "@/components/JourneyRail";

export default function MeditationsPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Meditations</p>
        <h1>Meditation Guidance</h1>
        <p className="muted">
          Personalized meditation practices aligned with your birth chart.
          Receive actionable breathwork, mantras, and step-by-step meditation instructions.
        </p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Meditation-only guidance</p>
        <h2>🧘 Guided Stillness & Breathwork</h2>
        <p className="muted">
          Receive meditation prompts rooted in lunar and planetary focus areas.
          This section contains ONLY meditation instructions — duration, steps, breath patterns,
          mantras, and visualization techniques. No general life wisdom is included here.
        </p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <MeditationPanel
          eyebrow="Meditation flow"
          title="Your Personalized Meditation Practice"
          description="Generate breathwork and meditation guidance using your birth chart and planetary alignments."
        />
      </div>
    </section>
  );
}
