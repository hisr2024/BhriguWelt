import JourneyRail from "@/components/JourneyRail";
import PredictionForm from "@/components/PredictionForm";

export default function BirthChartPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Birth Chart Generation</p>
        <h1>Birth Chart Analysis</h1>
        <p className="muted">
          Generate comprehensive rashi and bhava charts with detailed interpretations, dasha periods, and karmic insights.
        </p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Comprehensive Analysis</p>
        <h2>Complete Birth Chart Foundation</h2>
        <p className="muted">
          Generate your complete natal chart with Rashi (sign) and Bhava (house) divisions, Vimshottari Dasha periods,
          planetary positions, and extensive interpretations based on Bhrigu Samhita principles.
        </p>
        <ul className="kudos-list">
          <li>Interactive Rashi (Zodiac) Chart with planetary positions</li>
          <li>Bhava (House) Chart showing life areas and influences</li>
          <li>Vimshottari Dasha timeline with planetary periods</li>
          <li>Detailed interpretations of houses, planets, and their interactions</li>
          <li>Karmic insights and remedial measures</li>
          <li>Past life influences and future trajectory guidance</li>
        </ul>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <PredictionForm
          engine="horoscope"
          title="Birth Chart Results"
          description="Enter accurate birth details below to generate your complete natal chart with extensive results including Rashi chart, Bhava chart, Dasha periods, interpretations, and karmic insights."
        />
      </div>
    </section>
  );
}
