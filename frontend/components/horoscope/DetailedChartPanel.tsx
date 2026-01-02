import React, { useState } from 'react';

export interface LifeArea {
  strengths: string[];
  challenges: string[];
  turning_points: string[];
  guidance: string;
}

export interface YearwiseEvent {
  year: number;
  themes: string[];
  likely_events: string[];
  cautions: string[];
  supports: string[];
}

export interface BhriguIndicator {
  principle_id: string;
  name: string;
  description: string;
  sutra_reference: string;
}

export interface DetailedChart {
  correlation_id: string;
  chart_summary: string;
  key_personality_themes: string[];
  life_areas: {
    career: LifeArea;
    relationships: LifeArea;
    health: LifeArea;
    finances: LifeArea;
    spirituality: LifeArea;
  };
  yogas_or_bhrigu_indicators: BhriguIndicator[];
  yearwise_major_events: YearwiseEvent[];
  confidence_notes: string;
  schema_valid?: boolean;
  retry_count?: number;
}

/**
 * Type guard to validate if an unknown value is a valid DetailedChart
 */
export function isDetailedChart(value: unknown): value is DetailedChart {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const chart = value as Record<string, unknown>;

  // Check required string fields
  if (typeof chart.correlation_id !== 'string' || !chart.correlation_id) {
    return false;
  }
  if (typeof chart.chart_summary !== 'string' || !chart.chart_summary) {
    return false;
  }
  if (typeof chart.confidence_notes !== 'string') {
    return false;
  }

  // Check key_personality_themes is an array of strings
  if (!Array.isArray(chart.key_personality_themes) || chart.key_personality_themes.length === 0) {
    return false;
  }
  if (!chart.key_personality_themes.every((t: unknown) => typeof t === 'string')) {
    return false;
  }

  // Check life_areas structure
  if (!chart.life_areas || typeof chart.life_areas !== 'object') {
    return false;
  }

  const lifeAreas = chart.life_areas as Record<string, unknown>;
  const requiredAreas = ['career', 'relationships', 'health', 'finances', 'spirituality'];
  
  for (const area of requiredAreas) {
    if (!lifeAreas[area] || typeof lifeAreas[area] !== 'object') {
      return false;
    }
    const areaObj = lifeAreas[area] as Record<string, unknown>;
    if (!Array.isArray(areaObj.strengths) || 
        !Array.isArray(areaObj.challenges) || 
        !Array.isArray(areaObj.turning_points) ||
        typeof areaObj.guidance !== 'string') {
      return false;
    }
  }

  // Check yogas_or_bhrigu_indicators is an array
  if (!Array.isArray(chart.yogas_or_bhrigu_indicators)) {
    return false;
  }

  // Check yearwise_major_events is an array
  if (!Array.isArray(chart.yearwise_major_events)) {
    return false;
  }

  return true;
}

interface Props {
  detailedChart: DetailedChart;
  name?: string;
}

const LifeAreaSection: React.FC<{
  title: string;
  icon: string;
  area: LifeArea;
  defaultExpanded?: boolean;
}> = ({ title, icon, area, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="life-area-section">
      <button
        className="life-area-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="life-area-icon">{icon}</span>
        <h4>{title}</h4>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </button>

      {isExpanded && (
        <div className="life-area-content">
          <div className="life-area-subsection">
            <h5>✨ Strengths</h5>
            <ul>
              {area.strengths.map((strength, idx) => (
                <li key={idx}>{strength}</li>
              ))}
            </ul>
          </div>

          <div className="life-area-subsection">
            <h5>⚠️ Challenges</h5>
            <ul>
              {area.challenges.map((challenge, idx) => (
                <li key={idx}>{challenge}</li>
              ))}
            </ul>
          </div>

          <div className="life-area-subsection">
            <h5>🔄 Turning Points</h5>
            <ul>
              {area.turning_points.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="life-area-subsection guidance">
            <h5>💡 Guidance</h5>
            <p>{area.guidance}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function DetailedChartPanel({ detailedChart, name }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'life-areas' | 'timeline' | 'yogas'>('timeline');

  return (
    <div className="detailed-chart-panel">
      <div className="panel-header">
        <h3>📅 Birth Chart & Lifetime Predictions</h3>
        {name && <p className="seeker-name">{name}'s Detailed Horoscope</p>}
        <p className="panel-subtitle">Focus on Important Events & Life Milestones</p>
        {detailedChart.correlation_id && (
          <p className="correlation-id">
            <small>Correlation ID: {detailedChart.correlation_id}</small>
          </p>
        )}
      </div>

      {/* Tab Navigation - Reordered to emphasize timeline */}
      <div className="tab-navigation">
        <button
          className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          📅 Important Life Events
        </button>
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'life-areas' ? 'active' : ''}`}
          onClick={() => setActiveTab('life-areas')}
        >
          Life Areas
        </button>
        <button
          className={`tab ${activeTab === 'yogas' ? 'active' : ''}`}
          onClick={() => setActiveTab('yogas')}
        >
          Bhrigu Indicators
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <section className="chart-summary">
              <h4>📝 Chart Summary</h4>
              <p className="summary-text">{detailedChart.chart_summary}</p>
            </section>

            <section className="personality-themes">
              <h4>🎭 Key Personality Themes</h4>
              <div className="themes-grid">
                {detailedChart.key_personality_themes.map((theme, idx) => (
                  <div key={idx} className="theme-card">
                    <span className="theme-number">{idx + 1}</span>
                    <p>{theme}</p>
                  </div>
                ))}
              </div>
            </section>

            {detailedChart.confidence_notes && (
              <section className="confidence-notes">
                <h4>ℹ️ Confidence & Methodology</h4>
                <p className="notes-text">{detailedChart.confidence_notes}</p>
              </section>
            )}
          </div>
        )}

        {activeTab === 'life-areas' && (
          <div className="life-areas-tab">
            <p className="tab-intro">
              Detailed analysis of five major life dimensions based on Bhrigu Samhita principles:
            </p>
            <div className="life-areas-container">
              <LifeAreaSection
                title="Career & Profession"
                icon="💼"
                area={detailedChart.life_areas.career}
                defaultExpanded={true}
              />
              <LifeAreaSection
                title="Relationships & Partnerships"
                icon="❤️"
                area={detailedChart.life_areas.relationships}
              />
              <LifeAreaSection
                title="Health & Vitality"
                icon="🏥"
                area={detailedChart.life_areas.health}
              />
              <LifeAreaSection
                title="Finances & Prosperity"
                icon="💰"
                area={detailedChart.life_areas.finances}
              />
              <LifeAreaSection
                title="Spirituality & Inner Growth"
                icon="🙏"
                area={detailedChart.life_areas.spirituality}
              />
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="timeline-tab">
            <div className="tab-intro-banner">
              <h4>🎯 Lifetime Important Events & Milestones</h4>
              <p>
                Year-wise analysis of major life events based on your birth chart. 
                Each period highlights important transitions, opportunities, and challenges 
                according to Bhrigu Samhita principles.
              </p>
            </div>
            <div className="timeline-container">
              {detailedChart.yearwise_major_events.map((event, idx) => {
                // Determine if this is an important/highlighted event
                const isImportant = event.likely_events && event.likely_events.length > 0;
                
                return (
                  <div key={idx} className={`timeline-event ${isImportant ? 'important-event' : ''}`}>
                    <div className="event-year">
                      <span className="year-badge">{event.year}</span>
                      {isImportant && <span className="importance-marker">★ Important</span>}
                    </div>
                    <div className="event-content">
                      {event.themes && event.themes.length > 0 && (
                        <div className="event-section themes-section">
                          <h5>🎯 Life Themes</h5>
                          <ul>
                            {event.themes.map((theme, i) => (
                              <li key={i}>{theme}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {event.likely_events && event.likely_events.length > 0 && (
                        <div className="event-section important-section">
                          <h5>⭐ Important Events</h5>
                          <ul className="important-events-list">
                            {event.likely_events.map((evt, i) => (
                              <li key={i} className="important-event-item">{evt}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {event.cautions && event.cautions.length > 0 && (
                        <div className="event-section caution-section">
                          <h5>⚠️ Areas of Caution</h5>
                          <ul>
                            {event.cautions.map((caution, i) => (
                              <li key={i}>{caution}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {event.supports && event.supports.length > 0 && (
                        <div className="event-section support-section">
                          <h5>🌟 Supportive Factors</h5>
                          <ul>
                            {event.supports.map((support, i) => (
                              <li key={i}>{support}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'yogas' && (
          <div className="yogas-tab">
            <p className="tab-intro">
              Significant yogas and Bhrigu indicators found in your chart:
            </p>
            <div className="yogas-container">
              {detailedChart.yogas_or_bhrigu_indicators.length > 0 ? (
                detailedChart.yogas_or_bhrigu_indicators.map((indicator, idx) => (
                  <div key={idx} className="yoga-card">
                    <div className="yoga-header">
                      <span className="principle-id">{indicator.principle_id}</span>
                      <h5>{indicator.name}</h5>
                    </div>
                    <p className="yoga-description">{indicator.description}</p>
                    <p className="yoga-reference">
                      <em>Source: {indicator.sutra_reference}</em>
                    </p>
                  </div>
                ))
              ) : (
                <p className="no-data">No specific yogas identified in this chart.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Debug Info (only show if schema invalid) */}
      {detailedChart.schema_valid === false && (
        <div className="debug-info warning">
          <p>
            ⚠️ Note: Chart data may be incomplete. Schema validation: {detailedChart.schema_valid ? 'PASS' : 'FAIL'}
            {detailedChart.retry_count !== undefined && ` | Retries: ${detailedChart.retry_count}`}
          </p>
        </div>
      )}
    </div>
  );
}
