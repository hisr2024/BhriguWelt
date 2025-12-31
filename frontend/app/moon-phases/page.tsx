import CalendarForm from "@/components/CalendarForm";
import JourneyRail from "@/components/JourneyRail";

export default function MoonPhasesPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Moon phases</p>
        <h1>Moon Phases</h1>
        <p className="muted">Reveal tithi, nakshatra, and lunar timing for the day you choose.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Lunar phase readout</h2>
        <p className="muted">Translate Gregorian timing into moon phase and ritual context.</p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <CalendarForm />
      </div>
    </section>
  );
}
