import HoroscopeForm from "@/components/HoroscopeForm";
import JourneyRail from "@/components/JourneyRail";

export default function HoroscopePage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Horoscope</p>
        <h1>Horoscope</h1>
        <p className="muted">Generate charts and read calm, grounded insights.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Holistic Horoscope</h2>
        <p className="muted">Start here to generate your natal chart and core guidance.</p>
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
