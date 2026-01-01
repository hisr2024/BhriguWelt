'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import BackendHealthNotice from "@/components/BackendHealthNotice";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { loadBirthDetails, onBirthDetails, saveBirthDetails } from "@/lib/birthStorage";
import { requestCoreWisdom } from "@/lib/api";
import { useImmersiveFeedback } from "@/lib/immersive";
import type { BirthDetails } from "@/types/astro";

type MeditationResponse = {
  meditation_guidance?: {
    duration?: string;
    steps?: string[];
    focus_points?: string[];
    breath_pattern?: string;
    mantra?: string;
    visualization?: string;
    timing?: string;
  };
  sections?: Record<string, string>;
};

type Props = {
  title: string;
  description: string;
  eyebrow?: string;
};

export default function MeditationPanel({ title, description, eyebrow = "Meditation guidance" }: Props) {
  const [details, setDetails] = useState<BirthDetails>({ ...DEFAULT_BIRTH_DETAILS });
  const [payload, setPayload] = useState<MeditationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const { triggerSubmitFeedback } = useImmersiveFeedback();

  useEffect(() => {
    const stored = loadBirthDetails();
    if (stored) {
      setDetails((prev) => ({ ...prev, ...stored }));
    }
    return onBirthDetails((next) => setDetails((prev) => ({ ...prev, ...next })));
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const validateDetails = (payloadToValidate: BirthDetails): string | null => {
    if (!payloadToValidate.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(payloadToValidate.birthDate)) {
      return "Use YYYY-MM-DD between 1900-2100.";
    }
    if (!payloadToValidate.birthTime || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(payloadToValidate.birthTime)) {
      return "Use HH:MM in 24h format (e.g., 07:45).";
    }
    if (!payloadToValidate.birthPlace || payloadToValidate.birthPlace.length < 3) {
      return "Add a city and country (e.g., Jaipur, Bharat).";
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    triggerSubmitFeedback();
    setError(null);
    setPayload(null);
    setLoading(true);

    const validationIssue = validateDetails(details);
    if (validationIssue) {
      setLoading(false);
      setError(validationIssue);
      return;
    }

    try {
      // Request core wisdom with meditation focus areas
      const response = (await requestCoreWisdom(details, ["meditation", "breathwork", "stillness"])) as MeditationResponse;

      // Extract ONLY meditation-specific sections
      const meditationSections: Record<string, string> = {};

      if (response.sections) {
        Object.entries(response.sections).forEach(([key, value]) => {
          const lowerKey = key.toLowerCase();
          const lowerValue = value.toLowerCase();

          // Only include sections that are clearly meditation-focused
          if (
            lowerKey.includes('meditation') ||
            lowerKey.includes('breathwork') ||
            lowerKey.includes('stillness') ||
            lowerKey.includes('practice') ||
            lowerValue.includes('meditate') ||
            lowerValue.includes('breathe') ||
            lowerValue.includes('inhale') ||
            lowerValue.includes('exhale') ||
            lowerValue.includes('focus on')
          ) {
            meditationSections[key] = value;
          }
        });
      }

      setPayload({
        meditation_guidance: response.meditation_guidance,
        sections: meditationSections,
      });

      saveBirthDetails(details, { autoSubmit: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch meditation guidance";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const meditationGuidance = payload?.meditation_guidance;
  const sections = useMemo(() => Object.entries(payload?.sections ?? {}), [payload?.sections]);

  return (
    <section aria-labelledby="meditation-heading" className="meditation-panel">
      <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby="meditation-helper">
        <header className="section-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="meditation-heading">{title}</h2>
          <p className="muted" id="meditation-helper">
            {description}
          </p>
          <BackendHealthNotice />
        </header>

        <div className="form-grid">
          <div>
            <label htmlFor="med-name">Full name</label>
            <input
              id="med-name"
              name="name"
              required
              value={details.name}
              onChange={(event) => setDetails({ ...details, name: event.target.value })}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="med-birth-date">Birth date (YYYY-MM-DD)</label>
            <input
              id="med-birth-date"
              type="date"
              required
              value={details.birthDate}
              onChange={(event) => setDetails({ ...details, birthDate: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="med-birth-time">Birth time (HH:MM)</label>
            <input
              id="med-birth-time"
              type="time"
              required
              value={details.birthTime}
              onChange={(event) => setDetails({ ...details, birthTime: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="med-birth-place">Birth place</label>
            <input
              id="med-birth-place"
              required
              value={details.birthPlace}
              onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="ghost-button">
            {loading ? "Consulting folios..." : "Generate meditation guidance"}
          </button>
          <span className="badge">Meditation-only guidance — No general wisdom</span>
        </div>

        {error ? (
          <div className="error-banner" role="alert" aria-live="assertive" tabIndex={-1} ref={errorRef}>
            {error}
          </div>
        ) : null}
      </form>

      <div className="meditation-results" aria-live="polite">
        {payload ? (
          <>
            {/* Structured Meditation Guidance */}
            {meditationGuidance && (
              <div className="card highlight meditation-guide">
                <div className="section-card__header">
                  <h3>🧘 Your Personalized Meditation Practice</h3>
                  <span className="pill">Bhrigu-aligned</span>
                </div>

                <div className="meditation-structure">
                  {meditationGuidance.duration && (
                    <div className="meditation-item">
                      <strong>⏱️ Duration:</strong>
                      <p>{meditationGuidance.duration}</p>
                    </div>
                  )}

                  {meditationGuidance.timing && (
                    <div className="meditation-item">
                      <strong>🕐 Best Time:</strong>
                      <p>{meditationGuidance.timing}</p>
                    </div>
                  )}

                  {meditationGuidance.breath_pattern && (
                    <div className="meditation-item">
                      <strong>🌬️ Breath Pattern:</strong>
                      <p>{meditationGuidance.breath_pattern}</p>
                    </div>
                  )}

                  {meditationGuidance.focus_points && meditationGuidance.focus_points.length > 0 && (
                    <div className="meditation-item">
                      <strong>🎯 Focus Points:</strong>
                      <ul>
                        {meditationGuidance.focus_points.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {meditationGuidance.mantra && (
                    <div className="meditation-item">
                      <strong>🕉️ Mantra:</strong>
                      <p className="mantra-text">{meditationGuidance.mantra}</p>
                    </div>
                  )}

                  {meditationGuidance.visualization && (
                    <div className="meditation-item">
                      <strong>🌅 Visualization:</strong>
                      <p>{meditationGuidance.visualization}</p>
                    </div>
                  )}

                  {meditationGuidance.steps && meditationGuidance.steps.length > 0 && (
                    <div className="meditation-item">
                      <strong>📋 Step-by-Step Guide:</strong>
                      <ol className="meditation-steps">
                        {meditationGuidance.steps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meditation-only sections (filtered to exclude general wisdom) */}
            {sections.length > 0 && (
              <div className="section-card">
                <div className="section-card__header">
                  <h3>🌿 Additional Meditation Guidance</h3>
                  <span className="pill ghost">Meditation-focused only</span>
                </div>
                <div className="insight-grid">
                  {sections.map(([heading, text]) => (
                    <article key={heading} className="insight-pill">
                      <strong>{heading}</strong>
                      <p className="microcopy">{text}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {!meditationGuidance && sections.length === 0 && (
              <div className="card">
                <p className="muted">
                  No meditation-specific guidance found in response. Please ensure backend is configured
                  to return meditation instructions when focus areas include "meditation", "breathwork", or "stillness".
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="card">
            <div className="section-card__header">
              <h3>Meditation guidance results</h3>
              <span className="pill ghost">Awaiting input</span>
            </div>
            <p className="muted">
              Provide birth details to unlock personalized meditation practices aligned with your
              birth chart and current planetary positions.
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        .meditation-panel {
          container-type: inline-size;
        }

        .meditation-guide {
          background: linear-gradient(135deg, rgba(138, 92, 246, 0.1), rgba(77, 238, 234, 0.1));
          border-left: 4px solid var(--color-neon-purple);
        }

        .meditation-structure {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          margin-top: var(--space-3);
        }

        .meditation-item {
          padding: var(--space-3);
          background: rgba(138, 92, 246, 0.05);
          border-radius: var(--radius);
          border-left: 3px solid var(--color-neon-purple);
        }

        .meditation-item strong {
          display: block;
          margin-bottom: var(--space-2);
          color: var(--color-neon-purple);
        }

        .meditation-item p {
          margin: 0;
          line-height: 1.7;
        }

        .meditation-item ul,
        .meditation-item ol {
          margin: var(--space-2) 0 0;
          padding-left: var(--space-4);
        }

        .meditation-item li {
          margin-bottom: var(--space-2);
          line-height: 1.6;
        }

        .meditation-steps {
          counter-reset: step;
        }

        .meditation-steps li {
          position: relative;
          padding-left: var(--space-3);
        }

        .meditation-steps li::before {
          content: counter(step);
          counter-increment: step;
          position: absolute;
          left: 0;
          top: 0;
          width: 1.5rem;
          height: 1.5rem;
          background: var(--color-neon-purple);
          color: var(--color-cosmic-900);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .mantra-text {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--color-neon-lime);
          font-family: "Noto Sans Devanagari", sans-serif;
          text-align: center;
          padding: var(--space-3);
          background: rgba(190, 242, 100, 0.1);
          border-radius: var(--radius);
        }

        .meditation-results {
          margin-top: var(--space-5);
        }

        .section-card__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
        }

        .section-card__header h3 {
          margin: 0;
        }

        .insight-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-3);
        }

        .insight-pill {
          padding: var(--space-3);
          background: rgba(77, 238, 234, 0.05);
          border-radius: var(--radius);
          border-left: 3px solid var(--color-neon-cyan);
        }

        .insight-pill strong {
          display: block;
          margin-bottom: var(--space-2);
          color: var(--color-neon-cyan);
        }

        @container (max-width: 768px) {
          .meditation-structure {
            gap: var(--space-3);
          }

          .insight-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
}
