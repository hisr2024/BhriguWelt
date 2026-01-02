import HoroscopeForm from "@/components/HoroscopeForm";
import JourneyRail from "@/components/JourneyRail";

export default function HoroscopePage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Horoscope</p>
        <h1>Lifetime Predictions & Important Events</h1>
        <p className="muted">
          Detailed birth chart analysis focusing on major life events: Marriage, Career Success, 
          Children, Property, Health Transitions, Financial Milestones, and Spiritual Awakening 
          based on Bhrigu Samhita principles.
        </p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured Analysis</p>
        <h2>Important Life Events & Milestones</h2>
        <p className="muted">
          Generate your natal chart with comprehensive focus on important life events. Get detailed 
          insights into marriage timing, career breakthroughs, family expansion, property acquisition, 
          and major life transitions with year-wise predictions.
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
