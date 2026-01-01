import HoroscopeForm from "@/components/HoroscopeForm";

export default function HomePage() {
  return (
    <div className="serene-page">
      <section className="panel">
        <div className="section-heading">
          <h1>Birth Chart & Horoscope Analysis</h1>
          <p className="muted">
            Detailed life scan based on Bhrigu Samhita principles - covering Marriage, Success,
            Risky Periods, Downward Trends, and Major Life Events
          </p>
        </div>

        <div className="card highlight">
          <p className="eyebrow">Complete Life Analysis</p>
          <h2>Birth Chart with Detailed Horoscope</h2>
          <p className="muted">
            Enter your birth details to receive a comprehensive analysis of your life's major events,
            including marriage prospects, success periods, challenging phases, and transformational milestones.
            This analysis combines birth chart interpretation with detailed life events forecasting.
          </p>
        </div>

        <div className="panel__content--stacked">
          <HoroscopeForm />
        </div>

        <div className="card" style={{ marginTop: "2rem" }}>
          <h3>Separate Sections Available</h3>
          <p className="muted">
            For specialized analysis, visit our dedicated sections:
          </p>
          <ul style={{ marginTop: "1rem" }}>
            <li><a href="/future">Future Directives</a> - Detailed future outlook and guidance</li>
            <li><a href="/past-life">Past Lives</a> - Past life memories and karmic patterns</li>
            <li><a href="/dashboard">Full Dashboard</a> - Access all astrology tools</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
