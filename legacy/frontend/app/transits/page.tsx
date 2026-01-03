import TransitsForm from "@/components/TransitsForm";

export default function TransitsPage() {
  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Transits</p>
        <h1>Transits</h1>
        <p className="muted">Track live planetary shifts with remedies and precise guidance.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Transit overlay</h2>
        <p className="muted">Compare natal and current skies with actionable rituals.</p>
      </div>
      <div className="panel__content">
        <TransitsForm />
      </div>
    </section>
  );
}
