'use client';

import HoroscopeForm from "@/components/HoroscopeForm";

export default function HoroscopePage() {
  return (
    <div className="serene-page">
      <section className="panel">
        <div className="section-heading mystical-header">
          <div className="mystical-symbol" aria-hidden="true">🔮</div>
          <h1 className="gradient-text">Birth Chart & Horoscope</h1>
          <p className="mystical-subtitle">
            Year-wise Life Predictions based on Ancient Bhrigu Samhita
          </p>
          <p className="intro-text">
            Comprehensive birth chart analysis with year-by-year predictions for five major 
            life areas: Career, Relationships, Health, Finances, and Spirituality.
          </p>
        </div>

        <div className="card highlight mystical-card">
          <p className="eyebrow">Complete Life Analysis</p>
          <h2>📅 Year-wise Predictions & Major Life Events</h2>
          <p className="description-text">
            Enter your birth details to receive a detailed horoscope with year-by-year analysis
            of major life events. This traditional horoscope includes marriage timings,
            career milestones, success periods, challenging phases, and transformational 
            milestones — all grounded in Bhrigu Samhita principles.
          </p>
        </div>

        <div className="panel__content--stacked">
          <HoroscopeForm />
        </div>

        <div className="card info-card" style={{ marginTop: "2rem" }}>
          <h3>🌟 Five Important Life Events</h3>
          <p className="section-intro">
            Your horoscope will include detailed yearly predictions for these five major life areas:
          </p>
          <ul className="benefits-list">
            <li>
              <strong>💼 Career & Profession:</strong> Career milestones, job changes, promotions, 
              business ventures, and professional growth periods
            </li>
            <li>
              <strong>❤️ Relationships & Marriage:</strong> Marriage prospects, partnership timing, 
              relationship dynamics, and significant connections
            </li>
            <li>
              <strong>🏥 Health & Vitality:</strong> Health trends, vitality periods, areas requiring 
              attention, and wellness guidance
            </li>
            <li>
              <strong>💰 Finances & Prosperity:</strong> Financial growth phases, wealth accumulation, 
              investment opportunities, and monetary challenges
            </li>
            <li>
              <strong>🙏 Spirituality & Inner Growth:</strong> Spiritual awakening periods, 
              transformational milestones, and paths to enlightenment
            </li>
          </ul>
        </div>

        <div className="card warning-card" style={{ marginTop: "2rem" }}>
          <h3>📊 What's Included in Your Results</h3>
          <ul className="features-list">
            <li>✓ Detailed Birth Chart with planetary positions</li>
            <li>✓ Year-wise timeline of major life events</li>
            <li>✓ Strengths, challenges, and turning points for each life area</li>
            <li>✓ Bhrigu yogas and special indicators in your chart</li>
            <li>✓ Practical guidance and remedies for each life dimension</li>
            <li>✓ Confidence notes explaining the methodology used</li>
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
          font-size: 4rem;
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

        .intro-text {
          font-size: 1.1rem;
          color: var(--text-secondary);
          max-width: 800px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .eyebrow {
          text-transform: uppercase;
          font-size: 0.85rem;
          font-weight: 600;
          color: #8A5CF6;
          letter-spacing: 0.05em;
          margin-bottom: var(--space-2);
        }

        .mystical-card {
          background: linear-gradient(135deg, rgba(77, 238, 234, 0.1), rgba(138, 92, 246, 0.1));
          border-left: 4px solid #4DEEEA;
        }

        .description-text {
          font-size: 1.05rem;
          line-height: 1.7;
          color: var(--text-primary);
        }

        .info-card {
          background: rgba(190, 242, 100, 0.05);
          border-left: 4px solid #BEF264;
        }

        .warning-card {
          background: rgba(138, 92, 246, 0.05);
          border-left: 4px solid #8A5CF6;
        }

        .section-intro {
          font-size: 1.05rem;
          margin-bottom: var(--space-3);
          color: var(--text-secondary);
        }

        .benefits-list {
          list-style: none;
          padding: 0;
          margin: var(--space-3) 0 0;
        }

        .benefits-list li {
          padding: var(--space-3) 0;
          border-bottom: 1px solid rgba(77, 238, 234, 0.1);
          line-height: 1.6;
        }

        .benefits-list li:last-child {
          border-bottom: none;
        }

        .benefits-list strong {
          color: #4DEEEA;
          display: block;
          margin-bottom: var(--space-1);
          font-size: 1.1rem;
        }

        .features-list {
          list-style: none;
          padding: 0;
          margin: var(--space-3) 0 0;
        }

        .features-list li {
          padding: var(--space-2) 0;
          font-size: 1.05rem;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .gradient-text {
            font-size: 2rem;
          }

          .mystical-subtitle {
            font-size: 1rem;
          }

          .intro-text {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
