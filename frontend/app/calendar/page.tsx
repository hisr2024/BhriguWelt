import CalendarForm from "@/components/CalendarForm";
import JourneyRail from "@/components/JourneyRail";

export default function CalendarPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Calendar</p>
        <h1>Calendar</h1>
        <p className="muted">Convert Gregorian records into Śaka timing with instant guidance.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Śaka Calendar Converter</h2>
        <p className="muted">Align birth records with lunar timing and ritual dates.</p>
      </div>
      <div className="panel__content">
        <JourneyRail />
        <CalendarForm />
      </div>
    </section>
  );
}
