import HoroscopeForm from "@/components/HoroscopeForm";
import JourneyRail from "@/components/JourneyRail";

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
      </div>
      <div className="panel__content">
        <JourneyRail />
        <HoroscopeForm />
      </div>
    </section>
  );
}
