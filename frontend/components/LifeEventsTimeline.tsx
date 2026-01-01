'use client';

import { useState } from 'react';

export type LifeEvent = {
  event_type: 'marriage' | 'success' | 'risk' | 'downward' | 'transition';
  title: string;
  description: string;
  timing: string;
  certainty: number;
  sutra_reference: string;
  indicators: string[];
  severity?: string;
  remedies?: string[];
};

export type LifeEventsReport = {
  marriage_events: LifeEvent[];
  success_events: LifeEvent[];
  risky_periods: LifeEvent[];
  downward_trends: LifeEvent[];
  major_transitions: LifeEvent[];
  overall_life_summary: string;
};

type Props = {
  report: LifeEventsReport | null | undefined;
};

type TimelinePhase = {
  ageRange: string;
  startAge: number;
  events: Array<LifeEvent & { category: string; categoryColor: string }>;
};

function parseAgeRange(timing: string): { start: number; end: number } {
  // Parse various formats: "Ages 23-28", "Age 36-55 (19-year period)", "Ages 60+", "Throughout marriage"
  const agesMatch = timing.match(/Ages?\s+(\d+)(?:-(\d+))?/i);
  if (agesMatch) {
    const start = parseInt(agesMatch[1]);
    const end = agesMatch[2] ? parseInt(agesMatch[2]) : start + 10;
    return { start, end };
  }

  // Handle ranges like "Post-marriage years 5-15"
  const yearsMatch = timing.match(/years?\s+(\d+)-(\d+)/i);
  if (yearsMatch) {
    return { start: parseInt(yearsMatch[1]) + 25, end: parseInt(yearsMatch[2]) + 25 }; // Approximate
  }

  // Handle "Throughout marriage"
  if (timing.toLowerCase().includes('throughout')) {
    return { start: 25, end: 80 };
  }

  // Default fallback
  return { start: 30, end: 40 };
}

function getCategoryInfo(eventType: string): { name: string; color: string; icon: string } {
  const categories: Record<string, { name: string; color: string; icon: string }> = {
    marriage: { name: 'Marriage & Relationships', color: 'neon-pink', icon: '💕' },
    success: { name: 'Success & Achievements', color: 'neon-lime', icon: '✨' },
    risk: { name: 'Risky Periods', color: 'amber', icon: '⚠️' },
    downward: { name: 'Challenges & Obstacles', color: 'cosmic', icon: '🌊' },
    transition: { name: 'Major Life Transitions', color: 'neon-cyan', icon: '🔄' },
  };
  return categories[eventType] || { name: 'Life Event', color: 'cosmic', icon: '⭐' };
}

function organizeEventsIntoPhases(report: LifeEventsReport): TimelinePhase[] {
  const allEvents: Array<LifeEvent & { category: string; categoryColor: string }> = [];

  // Collect all events with category info
  const addEvents = (events: LifeEvent[], type: string) => {
    const catInfo = getCategoryInfo(type);
    events.forEach(event => {
      allEvents.push({
        ...event,
        category: catInfo.name,
        categoryColor: catInfo.color,
      });
    });
  };

  addEvents(report.marriage_events || [], 'marriage');
  addEvents(report.success_events || [], 'success');
  addEvents(report.risky_periods || [], 'risk');
  addEvents(report.downward_trends || [], 'downward');
  addEvents(report.major_transitions || [], 'transition');

  // Group into age-based phases
  const phases: TimelinePhase[] = [
    { ageRange: 'Early Life (18-25)', startAge: 18, events: [] },
    { ageRange: 'Young Adulthood (26-35)', startAge: 26, events: [] },
    { ageRange: 'Mid-Life (36-50)', startAge: 36, events: [] },
    { ageRange: 'Mature Years (51-65)', startAge: 51, events: [] },
    { ageRange: 'Elder Years (66+)', startAge: 66, events: [] },
  ];

  allEvents.forEach(event => {
    const { start, end } = parseAgeRange(event.timing);
    const midAge = (start + end) / 2;

    // Assign to appropriate phase
    for (const phase of phases) {
      const phaseEnd = phases[phases.indexOf(phase) + 1]?.startAge || 100;
      if (midAge >= phase.startAge && midAge < phaseEnd) {
        phase.events.push(event);
        break;
      }
    }
  });

  return phases.filter(phase => phase.events.length > 0);
}

export default function LifeEventsTimeline({ report }: Props) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  if (!report) {
    return (
      <div className="card">
        <p className="muted">No life events data available. Submit your birth details to generate analysis.</p>
      </div>
    );
  }

  const phases = organizeEventsIntoPhases(report);

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const getEventId = (event: LifeEvent, index: number) =>
    `${event.event_type}-${index}-${event.title.slice(0, 10)}`;

  return (
    <section className="life-events-section" aria-label="Year-wise Life Events Analysis">
      <div className="section-heading">
        <p className="eyebrow">Bhrigu Samhita Life Scan</p>
        <h2>📅 Your Life Journey - Year by Year</h2>
        <p className="muted">
          A comprehensive timeline of major life events based on ancient Bhrigu Samhita principles.
          Scroll through your life phases to see marriage prospects, success periods, challenges, and transitions.
          All predictions are derived from your birth chart and aligned with Vedic astrological wisdom.
        </p>
      </div>

      {/* Overall Summary */}
      <div className="card highlight life-events-summary">
        <h3>🌟 Overall Life Pattern</h3>
        <div className="summary-text">
          {report.overall_life_summary.split('\n\n').map((para, idx) => (
            <p key={idx} className={idx === 0 ? 'eyebrow' : ''}>{para}</p>
          ))}
        </div>
      </div>

      {/* Timeline by Age Phases */}
      <div className="life-events-timeline">
        {phases.map((phase, phaseIdx) => (
          <div key={phase.ageRange} className="timeline-phase">
            <div className="phase-header">
              <div className="phase-marker" aria-hidden="true">
                <span className="phase-number">{phaseIdx + 1}</span>
              </div>
              <div className="phase-info">
                <h3 className="phase-title">{phase.ageRange}</h3>
                <p className="muted">{phase.events.length} major {phase.events.length === 1 ? 'event' : 'events'} predicted</p>
              </div>
            </div>

            <div className="phase-events">
              {phase.events
                .sort((a, b) => b.certainty - a.certainty)
                .map((event, eventIdx) => {
                  const eventId = getEventId(event, eventIdx);
                  const isExpanded = expandedEvents.has(eventId);
                  const icon = getCategoryInfo(event.event_type).icon;

                  return (
                    <article
                      key={eventId}
                      className={`event-card event-card--${event.categoryColor}`}
                      aria-label={`${event.category}: ${event.title}`}
                    >
                      <div className="event-header" onClick={() => toggleEvent(eventId)}>
                        <div className="event-meta">
                          <span className="event-icon" aria-hidden="true">{icon}</span>
                          <span className={`pill pill--${event.categoryColor}`}>{event.category}</span>
                          <span className="event-timing">{event.timing}</span>
                        </div>
                        <h4 className="event-title">{event.title}</h4>
                        <div className="event-certainty">
                          <span className="certainty-label">Certainty:</span>
                          <div className="certainty-bar" aria-label={`${(event.certainty * 100).toFixed(0)}% certainty`}>
                            <div
                              className="certainty-fill"
                              style={{ width: `${event.certainty * 100}%` }}
                            />
                          </div>
                          <span className="certainty-value">{(event.certainty * 100).toFixed(0)}%</span>
                        </div>
                        <button
                          type="button"
                          className="expand-toggle"
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? 'Show less' : 'Show more'}
                        >
                          {isExpanded ? '▼ Show less' : '▶ Expand details'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="event-details">
                          <div className="event-description">
                            <h5>What to Expect</h5>
                            <p>{event.description}</p>
                          </div>

                          {event.indicators && event.indicators.length > 0 && (
                            <div className="event-indicators">
                              <h5>📊 Astrological Indicators</h5>
                              <ul>
                                {event.indicators.map((indicator, idx) => (
                                  <li key={idx}>{indicator}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {event.severity && (
                            <div className={`event-severity severity--${event.severity}`}>
                              <strong>Severity Level:</strong> {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
                            </div>
                          )}

                          {event.remedies && event.remedies.length > 0 && (
                            <div className="event-remedies">
                              <h5>🕉️ Recommended Remedies</h5>
                              <ul>
                                {event.remedies.map((remedy, idx) => (
                                  <li key={idx}>{remedy}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="event-source">
                            <small className="muted">
                              <strong>Source:</strong> {event.sutra_reference}
                            </small>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="life-events-footer">
        <p className="microcopy">
          ⚠️ <strong>Important Note:</strong> All timings and predictions are based on Bhrigu Samhita astrological principles
          and should be used as guidance for informed decision-making. Karmic patterns can be influenced by free will,
          spiritual practices, and conscious choices. Consult with qualified astrologers for personalized guidance.
        </p>
      </div>

      <style jsx>{`
        .life-events-section {
          container-type: inline-size;
          padding: var(--space-4) 0;
        }

        .life-events-summary {
          margin-bottom: var(--space-6);
          background: linear-gradient(135deg, rgba(77, 238, 234, 0.05), rgba(138, 92, 246, 0.05));
        }

        .summary-text {
          margin-top: var(--space-3);
          line-height: 1.7;
        }

        .summary-text p {
          margin-bottom: var(--space-3);
        }

        .life-events-timeline {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
          position: relative;
          padding-left: var(--space-8);
        }

        .timeline-phase {
          position: relative;
        }

        .timeline-phase::before {
          content: '';
          position: absolute;
          left: calc(var(--space-8) * -1 + 20px);
          top: 40px;
          bottom: -40px;
          width: 2px;
          background: linear-gradient(180deg,
            var(--color-neon-cyan),
            var(--color-neon-purple),
            var(--color-neon-pink)
          );
          opacity: 0.3;
        }

        .timeline-phase:last-child::before {
          display: none;
        }

        .phase-header {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          margin-bottom: var(--space-4);
        }

        .phase-marker {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-neon-cyan), var(--color-neon-purple));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-left: calc(var(--space-8) * -1);
          box-shadow: 0 0 20px rgba(77, 238, 234, 0.5);
        }

        .phase-number {
          color: var(--color-cosmic-900);
          font-weight: 700;
          font-size: 1.1rem;
        }

        .phase-title {
          margin: 0;
          font-size: 1.5rem;
          background: linear-gradient(90deg, var(--color-neon-cyan), var(--color-neon-pink));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .phase-events {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .event-card {
          background: var(--color-cosmic-800);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          border-left: 4px solid var(--color-neon-cyan);
          transition: all 0.3s ease;
        }

        .event-card--neon-pink {
          border-left-color: var(--color-neon-pink);
        }

        .event-card--neon-lime {
          border-left-color: var(--color-neon-lime);
        }

        .event-card--amber {
          border-left-color: #fbbf24;
        }

        .event-card--cosmic {
          border-left-color: var(--color-neon-purple);
        }

        .event-card:hover {
          background: var(--color-cosmic-700);
          transform: translateX(4px);
        }

        .event-header {
          cursor: pointer;
        }

        .event-meta {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
        }

        .event-icon {
          font-size: 1.5rem;
        }

        .pill {
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .pill--neon-pink {
          background: rgba(255, 91, 211, 0.1);
          color: var(--color-neon-pink);
        }

        .pill--neon-lime {
          background: rgba(178, 255, 89, 0.1);
          color: var(--color-neon-lime);
        }

        .pill--amber {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
        }

        .pill--cosmic {
          background: rgba(138, 92, 246, 0.1);
          color: var(--color-neon-purple);
        }

        .pill--neon-cyan {
          background: rgba(77, 238, 234, 0.1);
          color: var(--color-neon-cyan);
        }

        .event-timing {
          color: var(--color-muted);
          font-size: 0.875rem;
        }

        .event-title {
          margin: var(--space-2) 0;
          font-size: 1.1rem;
        }

        .event-certainty {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin: var(--space-3) 0;
        }

        .certainty-label {
          font-size: 0.875rem;
          color: var(--color-muted);
        }

        .certainty-bar {
          flex: 1;
          height: 6px;
          background: var(--color-cosmic-700);
          border-radius: var(--radius);
          overflow: hidden;
        }

        .certainty-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-neon-cyan), var(--color-neon-lime));
          transition: width 0.3s ease;
        }

        .certainty-value {
          font-weight: 700;
          color: var(--color-neon-cyan);
          min-width: 40px;
          text-align: right;
        }

        .expand-toggle {
          background: none;
          border: none;
          color: var(--color-neon-cyan);
          cursor: pointer;
          padding: var(--space-2) 0;
          font-size: 0.875rem;
          font-weight: 600;
          transition: color 0.2s;
        }

        .expand-toggle:hover {
          color: var(--color-neon-pink);
        }

        .event-details {
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--color-cosmic-700);
        }

        .event-details h5 {
          margin: var(--space-3) 0 var(--space-2);
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-neon-cyan);
        }

        .event-description p {
          line-height: 1.7;
          color: var(--color-text);
        }

        .event-indicators ul,
        .event-remedies ul {
          list-style: none;
          padding: 0;
          margin: var(--space-2) 0;
        }

        .event-indicators li,
        .event-remedies li {
          padding: var(--space-2);
          margin-bottom: var(--space-1);
          background: rgba(77, 238, 234, 0.05);
          border-radius: var(--radius);
          font-size: 0.9rem;
        }

        .event-remedies li::before {
          content: '🕉️ ';
          margin-right: var(--space-1);
        }

        .event-indicators li::before {
          content: '• ';
          color: var(--color-neon-cyan);
          font-weight: 700;
          margin-right: var(--space-1);
        }

        .event-severity {
          padding: var(--space-2);
          border-radius: var(--radius);
          margin: var(--space-3) 0;
          font-size: 0.875rem;
        }

        .severity--mild {
          background: rgba(178, 255, 89, 0.1);
          color: var(--color-neon-lime);
        }

        .severity--moderate {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
        }

        .severity--severe {
          background: rgba(255, 91, 211, 0.1);
          color: var(--color-neon-pink);
        }

        .event-source {
          margin-top: var(--space-3);
          padding-top: var(--space-2);
          border-top: 1px solid var(--color-cosmic-700);
        }

        .life-events-footer {
          margin-top: var(--space-6);
          padding: var(--space-4);
          background: rgba(251, 191, 36, 0.05);
          border-radius: var(--radius-lg);
          border-left: 4px solid #fbbf24;
        }

        @container (max-width: 640px) {
          .life-events-timeline {
            padding-left: var(--space-4);
          }

          .phase-marker {
            width: 32px;
            height: 32px;
            margin-left: calc(var(--space-4) * -1);
          }

          .phase-number {
            font-size: 0.9rem;
          }

          .timeline-phase::before {
            left: calc(var(--space-4) * -1 + 15px);
          }
        }
      `}</style>
    </section>
  );
}
