'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { requestTimeline } from '@/lib/api';
import { loadBirthDetails } from '@/lib/birthStorage';
import type { BirthDetails } from '@/types/astro';

type YearlyEvent = {
  year: number;
  age: number;
  events: string[];
  themes: string[];
  intensity: 'low' | 'medium' | 'high';
  auspicious: boolean;
};

type TimelineData = {
  name: string;
  yearly_events?: YearlyEvent[];
  phases?: Array<{
    id: string;
    title: string;
    window: string;
    house: number;
    detail: string;
    progress: number;
    planet: string;
    icon: string;
    milestones?: Array<{
      label: string;
      completion: number;
      note: string;
    }>;
  }>;
};

export default function YearWiseLifeTimeline() {
  const [birthDetails, setBirthDetails] = useState<BirthDetails | null>(null);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = loadBirthDetails();
    if (stored && stored.name && stored.birthDate && stored.birthTime && stored.birthPlace) {
      setBirthDetails(stored as BirthDetails);
      void fetchTimeline(stored as BirthDetails);
    }
  }, []);

  const fetchTimeline = useCallback(async (details: BirthDetails) => {
    setLoading(true);
    setError(null);

    try {
      const data = await requestTimeline(details, ['year-wise', 'life-events', 'phases']);
      setTimeline(data as TimelineData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to fetch timeline';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePhase = useCallback((phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  }, []);

  const currentYear = new Date().getFullYear();
  const birthYear = birthDetails?.birthDate ? new Date(birthDetails.birthDate).getFullYear() : currentYear - 30;
  const currentAge = currentYear - birthYear;

  const yearRanges = useMemo(() => {
    const ranges = [];
    for (let i = 0; i <= 100; i += 5) {
      ranges.push({
        label: `Ages ${i}-${i + 4}`,
        start: i,
        end: i + 4
      });
    }
    return ranges;
  }, []);

  if (!birthDetails) {
    return (
      <section className="panel">
        <div className="section-heading mystical-header">
          <div className="mystical-symbol" aria-hidden="true">🔮</div>
          <h1 className="gradient-text">Your Life Timeline</h1>
          <p className="mystical-subtitle">
            A sacred journey through time, guided by ancient Bhrigu Samhita wisdom
          </p>
          <p className="muted">
            Set your birth details in the{' '}
            <a href="/horoscope" className="link-accent">Birth Chart & Horoscope</a>
            {' '}section first to unlock your personalized year-wise life events timeline.
          </p>
        </div>
        <div className="card mystical-card">
          <div className="mystical-content">
            <h3>🌙 Unlock Your Cosmic Timeline</h3>
            <p>
              Discover major life events year by year - from marriage prospects to career milestones,
              challenging periods to transformative moments. All grounded in the sacred texts of Bhrigu Samhita.
            </p>
            <a href="/horoscope" className="button-primary">
              Begin Your Journey →
            </a>
          </div>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="panel">
        <div className="section-heading">
          <h1>Your Life Timeline</h1>
          <p className="muted">Loading your cosmic journey...</p>
        </div>
        <div className="card loading-card">
          <div className="loading-spinner mystical-spinner" aria-hidden="true">⏳</div>
          <p>Consulting the ancient Bhrigu Samhita manuscripts...</p>
          <p className="microcopy">This may take a moment as we trace your life path through the ages</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <div className="section-heading">
          <h1>Your Life Timeline</h1>
        </div>
        <div className="card error-card">
          <h3>Unable to Load Timeline</h3>
          <p className="error-message">{error}</p>
          <button
            type="button"
            onClick={() => birthDetails && fetchTimeline(birthDetails)}
            className="ghost-button"
          >
            🔄 Try Again
          </button>
        </div>
      </section>
    );
  }

  const phases = timeline?.phases || [];

  return (
    <section className="panel year-wise-timeline">
      <div className="section-heading mystical-header">
        <div className="mystical-symbol" aria-hidden="true">📜</div>
        <h1 className="gradient-text">Your Life Timeline</h1>
        <p className="mystical-subtitle">
          {birthDetails.name}'s journey through the ages
        </p>
        <p className="muted">
          Year-wise life events, milestones, and cosmic guidance based on Bhrigu Samhita principles.
          Current age: {currentAge} years.
        </p>
      </div>

      {/* Year Range Selector */}
      <div className="card timeline-controls">
        <h3>📅 Navigate Your Timeline</h3>
        <p className="muted microcopy">Select an age range to focus on specific life phases</p>
        <div className="year-range-selector">
          <button
            type="button"
            className={`year-range-button ${selectedYear === null ? 'active' : ''}`}
            onClick={() => setSelectedYear(null)}
          >
            All Years
          </button>
          {yearRanges.slice(0, 20).map(range => (
            <button
              key={range.start}
              type="button"
              className={`year-range-button ${
                selectedYear !== null && selectedYear >= range.start && selectedYear <= range.end ? 'active' : ''
              }`}
              onClick={() => setSelectedYear(range.start)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Phases */}
      <div className="timeline-container">
        {phases.length > 0 ? (
          <>
            <div className="timeline-rail" aria-hidden="true" />
            {phases.map((phase, idx) => {
              const isExpanded = expandedPhases.has(phase.id);

              return (
                <article
                  key={phase.id}
                  className={`timeline-phase-card ${isExpanded ? 'expanded' : ''}`}
                  data-intensity={phase.progress > 70 ? 'high' : phase.progress > 40 ? 'medium' : 'low'}
                >
                  <div className="phase-marker" aria-hidden="true">
                    <span className="phase-icon">{phase.icon}</span>
                    <span className="phase-number">{idx + 1}</span>
                  </div>

                  <div className="phase-content">
                    <header
                      className="phase-header"
                      onClick={() => togglePhase(phase.id)}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                    >
                      <div className="phase-title-section">
                        <h3>{phase.title}</h3>
                        <span className="phase-window">{phase.window}</span>
                      </div>
                      <div className="phase-meta">
                        <span className="pill">House {phase.house}</span>
                        <span className="pill ghost">{phase.planet}</span>
                        <span className={`progress-badge progress-${phase.progress > 70 ? 'high' : phase.progress > 40 ? 'medium' : 'low'}`}>
                          {phase.progress}% Active
                        </span>
                        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
                      </div>
                    </header>

                    <div className="phase-summary">
                      <p>{phase.detail}</p>
                    </div>

                    {isExpanded && phase.milestones && (
                      <div className="phase-milestones">
                        <h4>🎯 Key Milestones</h4>
                        <div className="milestones-grid">
                          {phase.milestones.map((milestone, mIdx) => (
                            <div key={mIdx} className="milestone-card">
                              <div className="milestone-header">
                                <strong>{milestone.label}</strong>
                                <span className="milestone-progress">{milestone.completion}%</span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${milestone.completion}%` }}
                                  aria-valuenow={milestone.completion}
                                  aria-valuemin={0}
                                  aria-valuemax={100}
                                  role="progressbar"
                                />
                              </div>
                              <p className="microcopy">{milestone.note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </>
        ) : (
          <div className="card">
            <p className="muted">
              No timeline phases available. The ancient manuscripts are still being consulted.
              Try refreshing or check back shortly.
            </p>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="card timeline-footer">
        <h3>🔗 Explore More</h3>
        <div className="footer-links">
          <a href="/future" className="footer-link-card">
            <span className="link-icon">🔮</span>
            <div>
              <strong>Future Directives</strong>
              <p className="microcopy">Detailed year-wise future outlook</p>
            </div>
          </a>
          <a href="/past-life" className="footer-link-card">
            <span className="link-icon">🌀</span>
            <div>
              <strong>Past Lives</strong>
              <p className="microcopy">Karmic patterns from previous incarnations</p>
            </div>
          </a>
          <a href="/dashboard" className="footer-link-card">
            <span className="link-icon">📊</span>
            <div>
              <strong>Full Dashboard</strong>
              <p className="microcopy">Access all astrology tools</p>
            </div>
          </a>
        </div>
      </div>

      <style jsx>{`
        .year-wise-timeline {
          container-type: inline-size;
        }

        .mystical-header {
          text-align: center;
          position: relative;
          padding: var(--space-6) var(--space-4);
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
          background: linear-gradient(90deg, var(--color-neon-cyan), var(--color-neon-pink), var(--color-neon-lime));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 2.5rem;
          margin-bottom: var(--space-2);
        }

        .mystical-subtitle {
          font-size: 1.2rem;
          color: var(--color-neon-cyan);
          margin-bottom: var(--space-3);
        }

        .mystical-card {
          background: linear-gradient(135deg, rgba(77, 238, 234, 0.1), rgba(138, 92, 246, 0.1));
          border-left: 4px solid var(--color-neon-cyan);
        }

        .mystical-content {
          text-align: center;
          padding: var(--space-4);
        }

        .mystical-content h3 {
          margin-top: 0;
          margin-bottom: var(--space-3);
        }

        .button-primary {
          display: inline-block;
          margin-top: var(--space-4);
          padding: var(--space-3) var(--space-5);
          background: linear-gradient(130deg, var(--color-neon-cyan), var(--color-neon-purple));
          color: var(--color-cosmic-900);
          font-weight: 600;
          border-radius: var(--radius-lg);
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .button-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(77, 238, 234, 0.3);
        }

        .timeline-controls {
          margin-bottom: var(--space-5);
        }

        .year-range-selector {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-top: var(--space-3);
        }

        .year-range-button {
          padding: var(--space-2) var(--space-3);
          background: var(--color-cosmic-800);
          border: 1px solid var(--color-cosmic-700);
          border-radius: var(--radius);
          color: var(--color-text);
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .year-range-button:hover {
          background: var(--color-cosmic-700);
          border-color: var(--color-neon-cyan);
        }

        .year-range-button.active {
          background: linear-gradient(130deg, rgba(77, 238, 234, 0.2), rgba(138, 92, 246, 0.2));
          border-color: var(--color-neon-cyan);
          color: var(--color-neon-cyan);
        }

        .timeline-container {
          position: relative;
          padding-left: var(--space-6);
        }

        .timeline-rail {
          position: absolute;
          left: 2rem;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(180deg, var(--color-neon-cyan), var(--color-neon-purple), var(--color-neon-lime));
          opacity: 0.3;
        }

        .timeline-phase-card {
          position: relative;
          margin-bottom: var(--space-5);
          background: var(--color-cosmic-800);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          border-left: 4px solid var(--color-neon-cyan);
          transition: all 0.3s;
        }

        .timeline-phase-card[data-intensity="high"] {
          border-left-color: var(--color-neon-lime);
        }

        .timeline-phase-card[data-intensity="medium"] {
          border-left-color: var(--color-neon-cyan);
        }

        .timeline-phase-card[data-intensity="low"] {
          border-left-color: var(--color-neon-purple);
        }

        .timeline-phase-card.expanded {
          box-shadow: 0 8px 24px rgba(77, 238, 234, 0.2);
        }

        .phase-marker {
          position: absolute;
          left: -3.5rem;
          top: var(--space-4);
          width: 3rem;
          height: 3rem;
          background: var(--color-cosmic-800);
          border: 3px solid var(--color-neon-cyan);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          z-index: 2;
        }

        .phase-icon {
          font-size: 1.2rem;
        }

        .phase-number {
          position: absolute;
          bottom: -0.5rem;
          right: -0.5rem;
          width: 1.5rem;
          height: 1.5rem;
          background: var(--color-neon-cyan);
          color: var(--color-cosmic-900);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .phase-header {
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-3);
        }

        .phase-title-section h3 {
          margin: 0 0 var(--space-1);
          font-size: 1.3rem;
        }

        .phase-window {
          font-size: 0.9rem;
          color: var(--color-muted);
        }

        .phase-meta {
          display: flex;
          gap: var(--space-2);
          align-items: center;
          flex-wrap: wrap;
        }

        .progress-badge {
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .progress-high {
          background: rgba(190, 242, 100, 0.2);
          color: var(--color-neon-lime);
        }

        .progress-medium {
          background: rgba(77, 238, 234, 0.2);
          color: var(--color-neon-cyan);
        }

        .progress-low {
          background: rgba(138, 92, 246, 0.2);
          color: var(--color-neon-purple);
        }

        .expand-icon {
          font-size: 0.8rem;
          color: var(--color-muted);
        }

        .phase-summary {
          line-height: 1.7;
          color: var(--color-text);
        }

        .phase-milestones {
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-cosmic-700);
        }

        .phase-milestones h4 {
          margin-top: 0;
          margin-bottom: var(--space-3);
        }

        .milestones-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-3);
        }

        .milestone-card {
          background: rgba(77, 238, 234, 0.05);
          padding: var(--space-3);
          border-radius: var(--radius);
        }

        .milestone-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-2);
        }

        .milestone-progress {
          color: var(--color-neon-cyan);
          font-weight: 700;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: var(--color-cosmic-700);
          border-radius: var(--radius);
          overflow: hidden;
          margin-bottom: var(--space-2);
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-neon-cyan), var(--color-neon-lime));
          transition: width 0.3s;
        }

        .timeline-footer {
          margin-top: var(--space-6);
        }

        .footer-links {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-3);
          margin-top: var(--space-3);
        }

        .footer-link-card {
          display: flex;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--color-cosmic-800);
          border-radius: var(--radius);
          text-decoration: none;
          color: var(--color-text);
          transition: all 0.2s;
        }

        .footer-link-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(77, 238, 234, 0.2);
          border-left: 3px solid var(--color-neon-cyan);
        }

        .link-icon {
          font-size: 2rem;
        }

        .footer-link-card strong {
          display: block;
          margin-bottom: var(--space-1);
        }

        .loading-card {
          text-align: center;
          padding: var(--space-6);
        }

        .mystical-spinner {
          font-size: 3rem;
          margin-bottom: var(--space-3);
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .error-card {
          background: rgba(255, 91, 211, 0.05);
          border-left: 4px solid var(--color-neon-pink);
          padding: var(--space-4);
        }

        .error-message {
          color: var(--color-neon-pink);
          margin: var(--space-3) 0;
        }

        .link-accent {
          color: var(--color-neon-cyan);
          text-decoration: underline;
        }

        .link-accent:hover {
          color: var(--color-neon-lime);
        }

        @container (max-width: 768px) {
          .timeline-container {
            padding-left: 0;
          }

          .timeline-rail,
          .phase-marker {
            display: none;
          }

          .phase-header {
            flex-direction: column;
            gap: var(--space-2);
          }
        }
      `}</style>
    </section>
  );
}
