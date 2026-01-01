import HoroscopeForm from "@/components/HoroscopeForm";

export default function HomePage() {
  return (
    <div className="serene-page">
      <section className="panel">
        <div className="section-heading mystical-header">
          <div className="mystical-symbol" aria-hidden="true">⭐</div>
          <h1 className="gradient-text">Birth Chart & Horoscope</h1>
          <p className="mystical-subtitle">
            Year-wise Life Predictions based on Ancient Bhrigu Samhita
          </p>
          <p className="muted">
            Comprehensive life analysis including year-wise major events, marriage prospects,
            success periods, challenging phases, and transformational milestones.
          </p>
        </div>

        <div className="card highlight mystical-card">
          <p className="eyebrow">Complete Life Analysis</p>
          <h2>📅 Year-wise Predictions & Major Life Events</h2>
          <p className="muted">
            Enter your birth details to receive a detailed horoscope with year-by-year analysis
            of major life events. This traditional Bharatiya horoscope includes marriage timings,
            career milestones, risky periods, and auspicious phases — all grounded in
            Bhrigu Samhita principles.
          </p>
        </div>

        <div className="panel__content--stacked">
          <HoroscopeForm />
        </div>

        <div className="card info-card" style={{ marginTop: "2rem" }}>
          <h3>🔮 What You'll Receive</h3>
          <ul className="benefits-list">
            <li>
              <strong>Year-wise Life Timeline:</strong> Major events predicted for each year of your life
            </li>
            <li>
              <strong>Marriage Prospects:</strong> Timing and characteristics of marriage events
            </li>
            <li>
              <strong>Success Periods:</strong> Career achievements and financial growth phases
            </li>
            <li>
              <strong>Risky Periods:</strong> Challenging times requiring caution
            </li>
            <li>
              <strong>Transformational Milestones:</strong> Major life transitions and spiritual growth
            </li>
            <li>
              <strong>Bhrigu-based Remedies:</strong> Personalized rituals and guidance
            </li>
          </ul>
        </div>

        <div className="card" style={{ marginTop: "2rem" }}>
          <h3>📚 Additional Specialized Tools</h3>
          <p className="muted">
            For focused analysis, explore our dedicated sections:
          </p>
          <ul style={{ marginTop: "1rem" }}>
            <li><a href="/future">Future Directives</a> - Detailed future outlook and guidance</li>
            <li><a href="/past-life">Past Lives</a> - Karmic patterns from previous incarnations</li>
            <li><a href="/dashboard">Full Dashboard</a> - Access all astrology tools</li>
          </ul>
        </div>
      </section>

      <style jsx>{`
        .mystical-header {
          text-align: center;
          padding: var(--space-5) var(--space-4);
        }

        .mystical-symbol {
          font-size: 3.5rem;
          margin-bottom: var(--space-3);
          animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        .gradient-text {
          background: linear-gradient(90deg, #4DEEEA, #8A5CF6, #BEF264);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 2.5rem;
          margin-bottom: var(--space-2);
        }

        .mystical-subtitle {
          font-size: 1.2rem;
          color: #4DEEEA;
          margin-bottom: var(--space-3);
        }

        .mystical-card {
          background: linear-gradient(135deg, rgba(77, 238, 234, 0.1), rgba(138, 92, 246, 0.1));
          border-left: 4px solid #4DEEEA;
        }

        .info-card {
          background: rgba(190, 242, 100, 0.05);
          border-left: 4px solid #BEF264;
        }

        .benefits-list {
          list-style: none;
          padding: 0;
          margin: var(--space-3) 0 0;
        }

        .benefits-list li {
          padding: var(--space-2) 0;
          border-bottom: 1px solid rgba(77, 238, 234, 0.1);
        }

        .benefits-list li:last-child {
          border-bottom: none;
        }

        .benefits-list strong {
          color: #4DEEEA;
          display: block;
          margin-bottom: var(--space-1);
        }
      `}</style>
    </div>
  );
}
