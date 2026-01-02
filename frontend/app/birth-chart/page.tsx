import HoroscopeForm from "@/components/HoroscopeForm";

export default function BirthChartPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Birth Chart Generation</p>
        <h1>Birth Chart & Lifetime Analysis</h1>
        <p className="muted">
          Generate comprehensive birth chart with focus on important life events, major milestones,
          and detailed year-wise predictions including marriage, career, health, and spiritual transitions.
        </p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Comprehensive Analysis</p>
        <h2>Birth Chart with Important Events Focus</h2>
        <p className="muted">
          Generate your complete natal chart with Rashi (sign) and Bhava (house) divisions,
          Vimshottari Dasha periods, planetary positions, and extensive year-wise predictions
          of important life events based on Bhrigu Samhita principles.
        </p>
      </div>
      <div className="panel__content">
        <HoroscopeForm />
      </div>
    </section>
  );
}
