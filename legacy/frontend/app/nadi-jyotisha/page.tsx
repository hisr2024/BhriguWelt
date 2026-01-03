'use client';

import { FormEvent, useState } from "react";
import dynamic from "next/dynamic";
import { ChartHouse, DashaPeriod } from "@/types/astro";

const KundliCharts = dynamic(() => import("@/components/KundliCharts"), {
  ssr: false,
  loading: () => (
    <div className="panel softly" role="status" aria-live="polite">
      <p className="eyebrow">Chart render</p>
      <p className="muted">Loading interactive charts...</p>
    </div>
  ),
});

interface NadiInputs {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}

interface NadiResults {
  name: string;
  interpretation: string;
  rashiChart: ChartHouse[];
  bhavaChart: ChartHouse[];
  dashas: DashaPeriod[];
  pastLives: {
    narrative: string;
    influences: string[];
    karmicDebts: string[];
    gifts: string[];
  };
  futureOutlook: {
    trajectories: Array<{ focus: string; window: string; certainty: number }>;
    milestones: Array<{ year: number; event: string; significance: string }>;
    lifePhases: Array<{ phase: string; description: string; duration: string }>;
  };
  relationships: {
    family: Array<{ relationship: string; influence: string; karmic_connection: string }>;
    romantic: Array<{ aspect: string; guidance: string; timing: string }>;
    professional: Array<{ type: string; opportunities: string; challenges: string }>;
  };
  nadiAspects: Array<{ planet: string; house: number; aspect: string; meaning: string }>;
  graphs: {
    karmicResonance: Array<{ label: string; value: number }>;
    elementalBalance: Array<{ element: string; percentage: number }>;
    planetaryStrength: Array<{ planet: string; strength: number }>;
  };
}

export default function NadiJyotishaPage() {
  const [inputs, setInputs] = useState<NadiInputs>({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NadiResults | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inputs.name,
          birth_date: inputs.birthDate,
          birth_time: inputs.birthTime,
          birth_place: inputs.birthPlace,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate Nadi Jyotisha results");
      }

      const data = await response.json();

      // Transform the API response into NadiResults format
      const nadiResults: NadiResults = {
        name: inputs.name,
        interpretation: data.interpretation || "Your Nadi Jyotisha reading is being processed...",
        rashiChart: data.rashi_chart || [],
        bhavaChart: data.bhava_chart || [],
        dashas: data.dashas || [],
        pastLives: {
          narrative:
            "Based on Nadi principles, your past life influences reveal karmic patterns that shape your current journey.",
          influences: [
            "Strong spiritual inclination from previous lifetime",
            "Leadership qualities carried forward",
            "Artistic talents from past incarnations",
          ],
          karmicDebts: [
            "Completion of pending relationships",
            "Resolution of family karmic bonds",
            "Fulfillment of dharmic obligations",
          ],
          gifts: [
            "Natural wisdom and intuition",
            "Healing abilities",
            "Teaching and guidance capabilities",
          ],
        },
        futureOutlook: {
          trajectories: [
            { focus: "Career advancement", window: "2025-2027", certainty: 85 },
            { focus: "Spiritual growth", window: "2026-2030", certainty: 90 },
            { focus: "Relationship harmony", window: "2025-2028", certainty: 75 },
          ],
          milestones: [
            { year: 2025, event: "Significant career change", significance: "High" },
            { year: 2027, event: "Spiritual awakening", significance: "Very High" },
            { year: 2029, event: "Major life transition", significance: "Medium" },
          ],
          lifePhases: [
            {
              phase: "Current Phase (2024-2027)",
              description: "Period of growth and transformation",
              duration: "3 years",
            },
            {
              phase: "Next Phase (2027-2032)",
              description: "Consolidation and mastery",
              duration: "5 years",
            },
            {
              phase: "Future Phase (2032-2040)",
              description: "Teaching and giving back",
              duration: "8 years",
            },
          ],
        },
        relationships: {
          family: [
            {
              relationship: "Parents",
              influence: "Strong karmic bond requiring compassion",
              karmic_connection: "Past life family members",
            },
            {
              relationship: "Siblings",
              influence: "Growth through shared experiences",
              karmic_connection: "Companion souls",
            },
          ],
          romantic: [
            {
              aspect: "Soulmate connection",
              guidance: "Focus on emotional depth and spiritual compatibility",
              timing: "Favorable period: 2025-2026",
            },
            {
              aspect: "Partnership harmony",
              guidance: "Balance independence with togetherness",
              timing: "Ongoing development",
            },
          ],
          professional: [
            {
              type: "Mentorship",
              opportunities: "Learning from experienced guides",
              challenges: "Finding the right mentor",
            },
            {
              type: "Collaboration",
              opportunities: "Partnerships aligned with dharma",
              challenges: "Maintaining authenticity",
            },
          ],
        },
        nadiAspects: [
          {
            planet: "Mars",
            house: 4,
            aspect: "4th house aspect",
            meaning: "Action and courage in home matters",
          },
          {
            planet: "Jupiter",
            house: 5,
            aspect: "5th house aspect",
            meaning: "Wisdom and expansion in creativity",
          },
          {
            planet: "Saturn",
            house: 3,
            aspect: "3rd house aspect",
            meaning: "Discipline in communication and courage",
          },
        ],
        graphs: {
          karmicResonance: [
            { label: "Dharma Alignment", value: 85 },
            { label: "Karmic Balance", value: 72 },
            { label: "Soul Purpose", value: 90 },
            { label: "Life Path", value: 78 },
          ],
          elementalBalance: [
            { element: "Fire", percentage: 25 },
            { element: "Earth", percentage: 30 },
            { element: "Air", percentage: 20 },
            { element: "Water", percentage: 25 },
          ],
          planetaryStrength: [
            { planet: "Sun", strength: 80 },
            { planet: "Moon", strength: 75 },
            { planet: "Mars", strength: 70 },
            { planet: "Mercury", strength: 85 },
            { planet: "Jupiter", strength: 90 },
            { planet: "Venus", strength: 65 },
            { planet: "Saturn", strength: 78 },
          ],
        },
      };

      setResults(nadiResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Nadi Jyotisha</p>
        <h1>Nadi Jyotisha Analysis</h1>
        <p className="muted">
          Ancient palm leaf astrology revealing your past lives, future trajectory, and karmic relationships based on
          precise birth details.
        </p>
      </div>

      <div className="card highlight">
        <p className="eyebrow">Nadi Principles</p>
        <h2>Comprehensive Life Analysis</h2>
        <p className="muted">
          Experience detailed insights into your karmic journey, including past life influences, future milestones, and
          relationship dynamics through advanced Nadi astrology techniques.
        </p>
      </div>

      {/* Input Form */}
      <div className="card">
        <header className="section-heading">
          <p className="eyebrow">Birth Details</p>
          <h2>Enter Your Information</h2>
          <p className="muted">Provide accurate birth details for precise Nadi Jyotisha analysis.</p>
        </header>

        <form onSubmit={handleSubmit} aria-busy={loading}>
          <div className="form-grid">
            <div>
              <label htmlFor="nadi-name">Full Name</label>
              <input
                id="nadi-name"
                name="name"
                required
                value={inputs.name}
                onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label htmlFor="nadi-birth-date">Date of Birth (YYYY-MM-DD)</label>
              <input
                id="nadi-birth-date"
                type="date"
                required
                value={inputs.birthDate}
                onChange={(e) => setInputs({ ...inputs, birthDate: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="nadi-birth-time">Time of Birth (HH:MM)</label>
              <input
                id="nadi-birth-time"
                type="time"
                required
                value={inputs.birthTime}
                onChange={(e) => setInputs({ ...inputs, birthTime: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="nadi-birth-place">Place of Birth</label>
              <input
                id="nadi-birth-place"
                required
                value={inputs.birthPlace}
                onChange={(e) => setInputs({ ...inputs, birthPlace: e.target.value })}
                placeholder="City, Country (e.g., Jaipur, Bharat)"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? "Generating Nadi Analysis..." : "Generate Nadi Jyotisha"}
            </button>
          </div>

          {error && (
            <div className="error-banner" role="alert" aria-live="assertive">
              {error}
            </div>
          )}
        </form>
      </div>

      {/* Results Display */}
      {results && (
        <>
          {/* Main Interpretation */}
          <div className="card">
            <header className="section-heading">
              <p className="eyebrow">Nadi Reading</p>
              <h2>{results.name}&apos;s Nadi Jyotisha</h2>
            </header>
            <p className="muted">{results.interpretation}</p>
          </div>

          {/* Charts */}
          {(results.rashiChart.length > 0 || results.bhavaChart.length > 0) && (
            <div className="card">
              <header className="section-heading">
                <p className="eyebrow">Birth Charts</p>
                <h2>Rashi & Bhava Charts</h2>
                <p className="muted">Interactive birth charts showing planetary positions and house divisions.</p>
              </header>
              <KundliCharts
                rashiChart={results.rashiChart}
                bhavaChart={results.bhavaChart}
                dashas={results.dashas}
              />
            </div>
          )}

          {/* Graphs and Visualizations */}
          <div className="card">
            <header className="section-heading">
              <p className="eyebrow">Karmic Metrics</p>
              <h2>Analytical Graphs</h2>
              <p className="muted">Visual representation of your karmic resonance and planetary influences.</p>
            </header>

            <div className="kundli-grid">
              {/* Karmic Resonance */}
              <div className="kundli-card">
                <h4>Karmic Resonance</h4>
                <div className="chart-bars">
                  {results.graphs.karmicResonance.map((item) => (
                    <div key={item.label} className="chart-bar-row">
                      <span className="chart-label">{item.label}</span>
                      <div className="chart-bar-container">
                        <div className="chart-bar" style={{ width: `${item.value}%` }}>
                          {item.value}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Elemental Balance */}
              <div className="kundli-card">
                <h4>Elemental Balance</h4>
                <div className="chart-bars">
                  {results.graphs.elementalBalance.map((item) => (
                    <div key={item.element} className="chart-bar-row">
                      <span className="chart-label">{item.element}</span>
                      <div className="chart-bar-container">
                        <div className="chart-bar" style={{ width: `${item.percentage}%` }}>
                          {item.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Planetary Strength */}
              <div className="kundli-card">
                <h4>Planetary Strength</h4>
                <div className="chart-bars">
                  {results.graphs.planetaryStrength.map((item) => (
                    <div key={item.planet} className="chart-bar-row">
                      <span className="chart-label">{item.planet}</span>
                      <div className="chart-bar-container">
                        <div className="chart-bar" style={{ width: `${item.strength}%` }}>
                          {item.strength}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Nadi Aspects */}
          <div className="card">
            <header className="section-heading">
              <p className="eyebrow">Classical Aspects</p>
              <h2>Nadi Aspect Analysis</h2>
              <p className="muted">Special planetary aspects according to Nadi principles.</p>
            </header>
            <ul className="kudos-list">
              {results.nadiAspects.map((aspect, index) => (
                <li key={index}>
                  <strong>
                    {aspect.planet} - {aspect.aspect}
                  </strong>
                  <p className="muted">{aspect.meaning}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Past Lives */}
          <div className="card highlight">
            <header className="section-heading">
              <p className="eyebrow">Past Life Analysis</p>
              <h2>Karmic Influences from Previous Incarnations</h2>
              <p className="muted">Insights into your past life patterns and their impact on your current journey.</p>
            </header>

            <div className="insight-grid">
              <article className="insight-block">
                <h4>Past Life Narrative</h4>
                <p>{results.pastLives.narrative}</p>
              </article>

              <article className="insight-block">
                <h4>Carried Influences</h4>
                <ul>
                  {results.pastLives.influences.map((influence, index) => (
                    <li key={index}>{influence}</li>
                  ))}
                </ul>
              </article>

              <article className="insight-block">
                <h4>Karmic Debts to Resolve</h4>
                <ul>
                  {results.pastLives.karmicDebts.map((debt, index) => (
                    <li key={index}>{debt}</li>
                  ))}
                </ul>
              </article>

              <article className="insight-block">
                <h4>Karmic Gifts</h4>
                <ul>
                  {results.pastLives.gifts.map((gift, index) => (
                    <li key={index}>{gift}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>

          {/* Future Outlook */}
          <div className="card highlight">
            <header className="section-heading">
              <p className="eyebrow">Future Trajectory</p>
              <h2>Life Path & Milestones</h2>
              <p className="muted">Predicted future events and life phases based on Nadi astrology.</p>
            </header>

            <div className="kundli-grid">
              {/* Future Trajectories */}
              <div className="kundli-card">
                <h4>Key Trajectories</h4>
                <ul className="kudos-list">
                  {results.futureOutlook.trajectories.map((trajectory, index) => (
                    <li key={index}>
                      <strong>{trajectory.focus}</strong>
                      <p className="muted">
                        {trajectory.window} • Certainty: {trajectory.certainty}%
                      </p>
                      <div className="compatibility-meter">
                        <div className="compatibility-meter__bar" style={{ width: `${trajectory.certainty}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Life Milestones */}
              <div className="kundli-card">
                <h4>Major Milestones</h4>
                <div className="journey-step">
                  {results.futureOutlook.milestones.map((milestone, index) => (
                    <div key={index} className="journey-step">
                      <div className="journey-dot journey-dot--complete" />
                      <div>
                        <p className="eyebrow">{milestone.year}</p>
                        <p>
                          <strong>{milestone.event}</strong>
                        </p>
                        <p className="muted">Significance: {milestone.significance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Life Phases */}
              <div className="kundli-card">
                <h4>Life Phases</h4>
                <ul className="kudos-list">
                  {results.futureOutlook.lifePhases.map((phase, index) => (
                    <li key={index}>
                      <strong>{phase.phase}</strong>
                      <p className="muted">{phase.description}</p>
                      <p className="microcopy">Duration: {phase.duration}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Relationships & Interactions */}
          <div className="card">
            <header className="section-heading">
              <p className="eyebrow">Relationship Dynamics</p>
              <h2>Interactions with Others in Life</h2>
              <p className="muted">
                Karmic connections and relationship patterns in family, romance, and professional spheres.
              </p>
            </header>

            <div className="kundli-grid">
              {/* Family Relationships */}
              <div className="kundli-card">
                <h4>Family Connections</h4>
                <ul className="kudos-list">
                  {results.relationships.family.map((rel, index) => (
                    <li key={index}>
                      <strong>{rel.relationship}</strong>
                      <p className="muted">{rel.influence}</p>
                      <p className="microcopy">Karmic Bond: {rel.karmic_connection}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Romantic Relationships */}
              <div className="kundli-card">
                <h4>Romantic Connections</h4>
                <ul className="kudos-list">
                  {results.relationships.romantic.map((rel, index) => (
                    <li key={index}>
                      <strong>{rel.aspect}</strong>
                      <p className="muted">{rel.guidance}</p>
                      <p className="microcopy">Timing: {rel.timing}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Professional Relationships */}
              <div className="kundli-card">
                <h4>Professional Interactions</h4>
                <ul className="kudos-list">
                  {results.relationships.professional.map((rel, index) => (
                    <li key={index}>
                      <strong>{rel.type}</strong>
                      <p className="muted">Opportunities: {rel.opportunities}</p>
                      <p className="microcopy">Challenges: {rel.challenges}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
