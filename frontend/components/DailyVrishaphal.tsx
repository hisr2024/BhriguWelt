'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadBirthDetails } from '@/lib/birthStorage';
import { requestVarshaphal } from '@/lib/api';
import { BirthDetails } from '@/types/astro';
import BackendHealthNotice from './BackendHealthNotice';

type DailyInsightSection = {
  title: string;
  content: string;
  icon: string;
  guidance: string[];
};

type DailyVrishaphalResponse = {
  date: string;
  tithi: string;
  nakshatra: string;
  yoga: string;
  insights: {
    mind_emotions?: string;
    work_money?: string;
    relationships?: string;
    health?: string;
    spiritual?: string;
  };
  favorable_times?: string[];
  avoid_times?: string[];
  daily_mantra?: string;
  lucky_direction?: string;
  color_of_day?: string;
  generated_at: string;
};

const CACHE_KEY = 'bhrigu_daily_vrishaphal';
const CACHE_DATE_KEY = 'bhrigu_daily_vrishaphal_date';

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getNextMidnight(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}

export default function DailyVrishaphal() {
  const [insights, setInsights] = useState<DailyVrishaphalResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const midnightTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load insights from cache if available and current
  const loadCachedInsights = useCallback(() => {
    if (typeof window === 'undefined') return null;

    const cachedDate = localStorage.getItem(CACHE_DATE_KEY);
    const todayDate = getTodayDateString();

    if (cachedDate === todayDate) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached) as DailyVrishaphalResponse;
        } catch {
          return null;
        }
      }
    }
    return null;
  }, []);

  // Save insights to cache
  const cacheInsights = useCallback((data: DailyVrishaphalResponse) => {
    if (typeof window === 'undefined') return;

    const todayDate = getTodayDateString();
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_DATE_KEY, todayDate);
  }, []);

  // Generate daily insights
  const generateInsights = useCallback(async (force = false) => {
    // Check cache first unless forced
    if (!force) {
      const cached = loadCachedInsights();
      if (cached) {
        setInsights(cached);
        setLastGenerated(cached.generated_at);
        return;
      }
    }

    const birthDetails = loadBirthDetails();
    if (!birthDetails || !birthDetails.birthDate || !birthDetails.birthTime || !birthDetails.birthPlace) {
      setError('Please set your birth details first to receive personalized daily insights.');
      return;
    }

    // Ensure all required properties are present
    const validBirthDetails = {
      ...birthDetails,
      name: birthDetails.name || 'Seeker',
      birthDate: birthDetails.birthDate!,
      birthTime: birthDetails.birthTime!,
      birthPlace: birthDetails.birthPlace!,
    } as BirthDetails;

    setLoading(true);
    setError(null);

    try {
      const todayDate = getTodayDateString();

      // Request varshaphal (yearly/daily predictions) from backend
      const response = await requestVarshaphal(validBirthDetails);

      // Transform backend response into our daily insights format
      const dailyInsights: DailyVrishaphalResponse = {
        date: todayDate,
        tithi: (response as any).tithi || 'Calculating...',
        nakshatra: (response as any).nakshatra || 'Calculating...',
        yoga: (response as any).yoga || 'Calculating...',
        insights: {
          mind_emotions: (response as any).mind_emotions || (response as any).interpretation || 'Your emotional landscape today is influenced by lunar energies.',
          work_money: (response as any).work_money || 'Focus on sustainable progress in professional matters.',
          relationships: (response as any).relationships || 'Communicate with clarity and compassion today.',
          health: (response as any).health || 'Balance rest with activity for optimal well-being.',
          spiritual: (response as any).spiritual || 'A day for inner reflection and spiritual practices.',
        },
        favorable_times: (response as any).favorable_times || ['06:00-08:00', '12:00-14:00', '18:00-20:00'],
        avoid_times: (response as any).avoid_times || [],
        daily_mantra: (response as any).mantra || 'Om Shanti Shanti Shanti',
        lucky_direction: (response as any).lucky_direction || 'East',
        color_of_day: (response as any).color || 'White',
        generated_at: new Date().toISOString(),
      };

      setInsights(dailyInsights);
      setLastGenerated(dailyInsights.generated_at);
      cacheInsights(dailyInsights);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to generate daily insights';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [loadCachedInsights, cacheInsights]);

  // Schedule midnight regeneration
  const scheduleMidnightRefresh = useCallback(() => {
    if (midnightTimerRef.current) {
      clearTimeout(midnightTimerRef.current);
    }

    const nextMidnight = getNextMidnight();
    const msUntilMidnight = nextMidnight.getTime() - Date.now();

    midnightTimerRef.current = setTimeout(() => {
      generateInsights(true); // Force regeneration
      scheduleMidnightRefresh(); // Schedule next midnight
    }, msUntilMidnight);
  }, [generateInsights]);

  // Initial load and setup
  useEffect(() => {
    generateInsights(false); // Load cached or generate new
    scheduleMidnightRefresh();

    return () => {
      if (midnightTimerRef.current) {
        clearTimeout(midnightTimerRef.current);
      }
    };
  }, [generateInsights, scheduleMidnightRefresh]);

  const sections: DailyInsightSection[] = useMemo(() => {
    if (!insights?.insights) return [];

    return [
      {
        title: 'Mind & Emotions',
        content: insights.insights.mind_emotions || '',
        icon: '🧠',
        guidance: ['Practice mindfulness', 'Journal your thoughts', 'Meditation recommended'],
      },
      {
        title: 'Work & Money',
        content: insights.insights.work_money || '',
        icon: '💼',
        guidance: ['Strategic decisions favored', 'Review finances', 'Network professionally'],
      },
      {
        title: 'Relationships',
        content: insights.insights.relationships || '',
        icon: '💕',
        guidance: ['Open communication', 'Quality time with loved ones', 'Resolve conflicts gently'],
      },
      {
        title: 'Health',
        content: insights.insights.health || '',
        icon: '🌿',
        guidance: ['Balanced diet', 'Physical activity', 'Adequate rest'],
      },
      {
        title: 'Spiritual Guidance',
        content: insights.insights.spiritual || '',
        icon: '🕉️',
        guidance: ['Morning prayers', 'Sacred reading', 'Inner reflection'],
      },
    ];
  }, [insights]);

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <section className="daily-vrishaphal" aria-label="Daily Personalized Insights">
      <div className="section-heading">
        <p className="eyebrow">Vrishaphal • Daily Horoscope</p>
        <h2>📅 Today's Personalized Guidance</h2>
        <p className="muted">
          Profile-specific insights based on your birth chart, current planetary transits, and Bhrigu predictive rules.
          Auto-refreshes daily at midnight.
        </p>
        <BackendHealthNotice />
      </div>

      {error && (
        <div className="card error-card">
          <p className="error-message">{error}</p>
          <button
            type="button"
            onClick={() => window.location.href = '/horoscope'}
            className="ghost-button small"
          >
            Set Birth Details
          </button>
        </div>
      )}

      {loading && (
        <div className="card loading-card">
          <div className="loading-spinner" aria-hidden="true">⏳</div>
          <p>Consulting Bhrigu manuscripts for today's guidance...</p>
        </div>
      )}

      {insights && !error && (
        <div className="vrishaphal-content">
          {/* Date and Panchang Header */}
          <div className="card highlight vrishaphal-header">
            <div className="header-grid">
              <div>
                <h3 className="date-title">{new Date(insights.date).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</h3>
                <p className="muted">
                  Last updated: {lastGenerated ? formatTime(lastGenerated) : 'Today'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => generateInsights(true)}
                className="ghost-button small"
                disabled={loading}
              >
                🔄 Refresh Now
              </button>
            </div>

            <div className="panchang-grid">
              <div className="panchang-item">
                <span className="panchang-label">Tithi</span>
                <span className="panchang-value">{insights.tithi}</span>
              </div>
              <div className="panchang-item">
                <span className="panchang-label">Nakshatra</span>
                <span className="panchang-value">{insights.nakshatra}</span>
              </div>
              <div className="panchang-item">
                <span className="panchang-label">Yoga</span>
                <span className="panchang-value">{insights.yoga}</span>
              </div>
            </div>
          </div>

          {/* Quick Summary Cards */}
          <div className="quick-summary">
            {insights.daily_mantra && (
              <div className="summary-card">
                <span className="summary-icon">🕉️</span>
                <div>
                  <h4>Today's Mantra</h4>
                  <p>{insights.daily_mantra}</p>
                </div>
              </div>
            )}
            {insights.lucky_direction && (
              <div className="summary-card">
                <span className="summary-icon">🧭</span>
                <div>
                  <h4>Lucky Direction</h4>
                  <p>{insights.lucky_direction}</p>
                </div>
              </div>
            )}
            {insights.color_of_day && (
              <div className="summary-card">
                <span className="summary-icon">🎨</span>
                <div>
                  <h4>Color of the Day</h4>
                  <p>{insights.color_of_day}</p>
                </div>
              </div>
            )}
          </div>

          {/* Main Insights Sections */}
          <div className="insights-grid">
            {sections.map((section) => (
              <article key={section.title} className="insight-card">
                <div className="insight-header">
                  <span className="insight-icon" aria-hidden="true">{section.icon}</span>
                  <h3>{section.title}</h3>
                </div>
                <p className="insight-content">{section.content}</p>
                <div className="insight-guidance">
                  <h4>Quick Tips:</h4>
                  <ul>
                    {section.guidance.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          {/* Timing Guidance */}
          {(insights.favorable_times?.length || insights.avoid_times?.length) && (
            <div className="card timing-card">
              <h3>🕐 Timing Guidance</h3>
              <div className="timing-grid">
                {insights.favorable_times && insights.favorable_times.length > 0 && (
                  <div className="timing-section favorable">
                    <h4>✅ Favorable Times</h4>
                    <ul>
                      {insights.favorable_times.map((time, idx) => (
                        <li key={idx}>{time}</li>
                      ))}
                    </ul>
                    <p className="microcopy">Best for important decisions, meetings, and new beginnings</p>
                  </div>
                )}
                {insights.avoid_times && insights.avoid_times.length > 0 && (
                  <div className="timing-section avoid">
                    <h4>⚠️ Times to Avoid</h4>
                    <ul>
                      {insights.avoid_times.map((time, idx) => (
                        <li key={idx}>{time}</li>
                      ))}
                    </ul>
                    <p className="microcopy">Postpone major commitments during these periods</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="vrishaphal-footer">
            <p className="microcopy">
              💡 <strong>Note:</strong> These insights are generated based on your birth chart and today's planetary positions.
              Daily insights automatically refresh at 00:00 local time. All guidance follows Bhrigu Samhita principles.
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        .daily-vrishaphal {
          container-type: inline-size;
        }

        .error-card {
          background: rgba(255, 91, 211, 0.05);
          border-left: 4px solid var(--color-neon-pink);
          padding: var(--space-4);
        }

        .error-message {
          margin-bottom: var(--space-3);
          color: var(--color-neon-pink);
        }

        .loading-card {
          text-align: center;
          padding: var(--space-6);
        }

        .loading-spinner {
          font-size: 3rem;
          animation: spin 2s linear infinite;
          margin-bottom: var(--space-3);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .vrishaphal-content {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .vrishaphal-header {
          background: linear-gradient(135deg, rgba(77, 238, 234, 0.1), rgba(138, 92, 246, 0.1));
        }

        .header-grid {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--space-4);
          gap: var(--space-3);
        }

        .date-title {
          margin: 0 0 var(--space-1);
          font-size: 1.5rem;
          background: linear-gradient(90deg, var(--color-neon-cyan), var(--color-neon-pink));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .panchang-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-3);
          margin-top: var(--space-3);
        }

        .panchang-item {
          display: flex;
          flex-direction: column;
          padding: var(--space-2);
          background: rgba(77, 238, 234, 0.05);
          border-radius: var(--radius);
        }

        .panchang-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-muted);
          margin-bottom: var(--space-1);
        }

        .panchang-value {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--color-neon-cyan);
        }

        .quick-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-3);
        }

        .summary-card {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--color-cosmic-800);
          border-radius: var(--radius-lg);
          border-left: 3px solid var(--color-neon-lime);
        }

        .summary-icon {
          font-size: 2rem;
          flex-shrink: 0;
        }

        .summary-card h4 {
          margin: 0 0 var(--space-1);
          font-size: 0.9rem;
          color: var(--color-muted);
        }

        .summary-card p {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .insights-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--space-4);
        }

        .insight-card {
          background: var(--color-cosmic-800);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          border-top: 3px solid var(--color-neon-purple);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .insight-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(77, 238, 234, 0.15);
        }

        .insight-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }

        .insight-icon {
          font-size: 2rem;
        }

        .insight-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }

        .insight-content {
          line-height: 1.7;
          margin-bottom: var(--space-3);
          color: var(--color-text);
        }

        .insight-guidance h4 {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-muted);
          margin: var(--space-3) 0 var(--space-2);
        }

        .insight-guidance ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .insight-guidance li {
          padding: var(--space-1) 0;
          font-size: 0.9rem;
          color: var(--color-muted);
        }

        .insight-guidance li::before {
          content: '→ ';
          color: var(--color-neon-cyan);
          margin-right: var(--space-1);
        }

        .timing-card {
          background: var(--color-cosmic-800);
        }

        .timing-card h3 {
          margin-top: 0;
        }

        .timing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-4);
          margin-top: var(--space-3);
        }

        .timing-section ul {
          list-style: none;
          padding: 0;
          margin: var(--space-2) 0;
        }

        .timing-section li {
          padding: var(--space-2);
          margin-bottom: var(--space-1);
          background: rgba(77, 238, 234, 0.05);
          border-radius: var(--radius);
          font-weight: 600;
        }

        .favorable li {
          border-left: 3px solid var(--color-neon-lime);
        }

        .avoid li {
          border-left: 3px solid #fbbf24;
        }

        .vrishaphal-footer {
          padding: var(--space-3);
          background: rgba(138, 92, 246, 0.05);
          border-radius: var(--radius);
          border-left: 3px solid var(--color-neon-purple);
        }

        @container (max-width: 768px) {
          .header-grid {
            flex-direction: column;
          }

          .insights-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
