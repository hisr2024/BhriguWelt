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
        <h2>Karmic History Scan</h2>
        <p className="muted">
          Reveal your past-life karmic patterns, unfinished business, and soul themes based on
          Nadi Jyotisha indicators and Bhrigu Samhita sutras. Exclusively focused on your karmic past.
        </p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <PredictionForm
          engine="past-life"
          title="Past-Life Karmic Analysis"
          description="Uncover karmic echoes, soul patterns, and repeating life themes from your past incarnations. This analysis is strictly backward-looking and independent from future predictions."
        />
      </div>
    </section>
  );
}
