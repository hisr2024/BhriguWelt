import HoroscopeForm from "@/components/HoroscopeForm";
import JourneyRail from "@/components/JourneyRail";

export default function HoroscopePage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Horoscope</p>
        <h1>Horoscope with Life Events Analysis</h1>
        <p className="muted">
          Detailed birth chart analysis with major life events: Marriage, Success, Risky Periods,
          Downward Trends, and Transformational Milestones based on Bhrigu Samhita principles.
        </p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Holistic Horoscope & Life Scan</h2>
        <p className="muted">
          Generate your natal chart with comprehensive life events analysis. Get detailed insights
          into marriage prospects, career success, challenging periods, and major life transitions.
        </p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <div className="panel__content--stacked">
          <HoroscopeForm />
        </div>
      </div>
    </section>
  );
}
