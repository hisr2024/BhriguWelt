'use client';

import AnimatedLogo from "@/components/AnimatedLogo";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="serene-page">
      <section className="panel">
        {/* Hero Section with Big Logo Animation */}
        <div className="hero-section">
          <div className="logo-container">
            <AnimatedLogo />
          </div>
          <h1 className="hero-title gradient-text">BhriguWelt</h1>
          <p className="hero-subtitle">Ancient Wisdom for Modern Life</p>
        </div>

        {/* About Bhrigu Jyotisha Section */}
        <div className="about-section">
          <div className="card highlight mystical-card">
            <div className="card-icon">🕉️</div>
            <h2>About Bhrigu Jyotisha</h2>
            <p className="about-text">
              Bhrigu Jyotisha (Vedic Astrology) is an ancient Indian system of astrology 
              named after the sage Bhrigu, one of the Saptarishis (seven great sages) in 
              Hindu mythology. The <strong>Bhrigu Samhita</strong> is a legendary astrological 
              treatise attributed to Maharishi Bhrigu, containing detailed horoscopes and 
              life predictions based on planetary positions at the time of birth.
            </p>
            <p className="about-text">
              This sacred science provides profound insights into an individual's life path, 
              karma, and destiny through careful analysis of birth charts, planetary periods 
              (dashas), and yogas. Unlike generic predictions, Bhrigu Jyotisha offers 
              personalized guidance grounded in timeless Vedic wisdom.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Detailed Birth Charts</h3>
              <p>
                Comprehensive analysis of your natal chart including planetary positions, 
                houses, and their influences on various life areas.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Year-wise Predictions</h3>
              <p>
                Discover major life events predicted for each year including career milestones, 
                relationship changes, and transformational periods.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💫</div>
              <h3>Five Life Areas</h3>
              <p>
                In-depth insights into Career, Relationships, Health, Finances, and 
                Spirituality based on ancient Bhrigu principles.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🌟</div>
              <h3>Yogas & Indicators</h3>
              <p>
                Identification of special planetary combinations (yogas) and Bhrigu 
                indicators that shape your unique destiny.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="cta-section">
          <div className="card cta-card">
            <h2>Begin Your Journey</h2>
            <p className="cta-text">
              Unlock the wisdom of the ages and discover what the stars have written 
              for you. Get your personalized horoscope with year-wise predictions for 
              all major life events.
            </p>
            <div className="cta-buttons">
              <Link href="/horoscope" className="primary-button">
                Get Your Horoscope
              </Link>
              <Link href="/dashboard" className="secondary-button">
                Explore All Tools
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .hero-section {
          text-align: center;
          padding: var(--space-8) var(--space-4) var(--space-6);
          background: linear-gradient(135deg, rgba(77, 238, 234, 0.05), rgba(138, 92, 246, 0.05));
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-6);
        }

        .logo-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: var(--space-4);
          min-height: 150px;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 700;
          margin-bottom: var(--space-2);
        }

        .gradient-text {
          background: linear-gradient(90deg, #4DEEEA, #8A5CF6, #BEF264);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: 1.5rem;
          color: #4DEEEA;
          margin-bottom: var(--space-2);
        }

        .about-section {
          margin-bottom: var(--space-6);
        }

        .card {
          padding: var(--space-5);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-4);
        }

        .card-icon {
          font-size: 3rem;
          text-align: center;
          margin-bottom: var(--space-3);
        }

        .mystical-card {
          background: linear-gradient(135deg, rgba(77, 238, 234, 0.1), rgba(138, 92, 246, 0.1));
          border-left: 4px solid #4DEEEA;
        }

        .mystical-card h2 {
          text-align: center;
          color: #4DEEEA;
          font-size: 2rem;
          margin-bottom: var(--space-3);
        }

        .about-text {
          font-size: 1.1rem;
          line-height: 1.8;
          margin-bottom: var(--space-3);
          color: var(--text-primary);
        }

        .about-text strong {
          color: #8A5CF6;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-4);
          margin-top: var(--space-4);
        }

        .feature-card {
          padding: var(--space-4);
          background: rgba(190, 242, 100, 0.05);
          border-radius: var(--radius-md);
          border: 1px solid rgba(77, 238, 234, 0.2);
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(77, 238, 234, 0.2);
          border-color: #4DEEEA;
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: var(--space-2);
        }

        .feature-card h3 {
          color: #8A5CF6;
          font-size: 1.3rem;
          margin-bottom: var(--space-2);
        }

        .feature-card p {
          line-height: 1.6;
          color: var(--text-secondary);
        }

        .cta-section {
          margin-top: var(--space-6);
        }

        .cta-card {
          background: linear-gradient(135deg, rgba(138, 92, 246, 0.15), rgba(190, 242, 100, 0.1));
          border: 2px solid #8A5CF6;
          text-align: center;
        }

        .cta-card h2 {
          font-size: 2.5rem;
          color: #8A5CF6;
          margin-bottom: var(--space-3);
        }

        .cta-text {
          font-size: 1.2rem;
          line-height: 1.8;
          margin-bottom: var(--space-4);
          color: var(--text-primary);
        }

        .cta-buttons {
          display: flex;
          gap: var(--space-3);
          justify-content: center;
          flex-wrap: wrap;
        }

        .primary-button,
        .secondary-button {
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-md);
          font-size: 1.1rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .primary-button {
          background: linear-gradient(135deg, #4DEEEA, #8A5CF6);
          color: #000;
        }

        .primary-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(77, 238, 234, 0.4);
        }

        .secondary-button {
          background: transparent;
          border: 2px solid #BEF264;
          color: #BEF264;
        }

        .secondary-button:hover {
          background: rgba(190, 242, 100, 0.1);
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1.2rem;
          }

          .cta-card h2 {
            font-size: 2rem;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
