"use client";

import { useEffect, useState } from "react";
import { requestExperienceFlow } from "@/lib/api";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { loadBirthDetails, onBirthDetails, StoredBirthDetails } from "@/lib/birthStorage";
import { BirthDetails } from "@/types/astro";

type ExperienceFlowResponse = {
  seeker?: {
    name?: string;
    birth_date?: string;
    birth_time?: string;
    birth_place?: string;
    tradition?: string;
  };
  interpretations?: { title?: string; summary?: string }[];
  visuals?: {
    flowchart_steps?: string[];
  };
  language_layer?: { tone?: string; accent?: string; primary_language?: string };
};

export default function ExperiencePage() {
  const [details, setDetails] = useState<BirthDetails>({ ...DEFAULT_BIRTH_DETAILS });
  const [flow, setFlow] = useState<ExperienceFlowResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyStoredDetails = (stored: StoredBirthDetails) => {
    setDetails((prev) => ({
      ...prev,
      name: stored.name ?? prev.name,
      birthDate: stored.birthDate ?? prev.birthDate,
      birthTime: stored.birthTime ?? prev.birthTime,
      birthPlace: stored.birthPlace ?? prev.birthPlace,
      timezone: stored.timezone ?? prev.timezone,
      tradition: stored.tradition ?? prev.tradition,
      lunarTithi: stored.lunarTithi ?? prev.lunarTithi,
      moonElement: stored.moonElement ?? prev.moonElement,
      marsHouse: stored.marsHouse ?? prev.marsHouse,
      saturnHouse: stored.saturnHouse ?? prev.saturnHouse,
      venusHouse: stored.venusHouse ?? prev.venusHouse,
      rahuAspectsAscendant: stored.rahuAspectsAscendant ?? prev.rahuAspectsAscendant,
      ketuHouse: stored.ketuHouse ?? prev.ketuHouse,
      mercuryHouse: stored.mercuryHouse ?? prev.mercuryHouse,
      jupiterHouse: stored.jupiterHouse ?? prev.jupiterHouse,
      saturnRetrograde: stored.saturnRetrograde ?? prev.saturnRetrograde,
    }));
  };

  useEffect(() => {
    const stored = loadBirthDetails();
    if (stored) {
      applyStoredDetails(stored);
    }
    return onBirthDetails((payload) => applyStoredDetails(payload));
  }, []);

  const handleGenerate = async () => {
    setError(null);
    if (!details.birthDate || !details.birthTime || !details.birthPlace) {
      setError("Add birth date, time, and place to generate the experience flow.");
      return;
    }
    setLoading(true);
    try {
      const response = await requestExperienceFlow(details);
      setFlow(response as ExperienceFlowResponse);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to generate experience flow.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const flowSteps = flow?.visuals?.flowchart_steps ?? [];

  return (
    <section className="panel">
      <div className="section-heading">
        <p className="eyebrow">Experience</p>
        <h1>Experience</h1>
        <p className="muted">Generate a unified experience flow for a single end-to-end report.</p>
      </div>
      <div className="card highlight">
        <p className="eyebrow">Featured tool</p>
        <h2>Experience Flow</h2>
        <p className="muted">Build the unified narrative sequence across horoscope, past, and future.</p>
      </div>
      <div className="panel__content">
        <div className="panel__content--stacked">
          <div className="card softly">
            <div className="section-heading">
              <p className="eyebrow">Unified flow</p>
              <h3>Generate experience journey</h3>
              <p className="muted">
                This snapshot merges horoscope, past-life, and future pillars into a single flowchart.
              </p>
            </div>
            <div className="stack">
              <button type="button" onClick={handleGenerate} disabled={loading}>
                {loading ? "Preparing experience..." : "Generate experience flow"}
              </button>
              <p className="microcopy">
                Use any birth-input tool first (e.g., Horoscope or Calendar) to save details for this flow.
              </p>
              {error && (
                <p className="microcopy" role="alert">
                  {error}
                </p>
              )}
              {flowSteps.length ? (
                <ul>
                  {flowSteps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              ) : (
                <p className="microcopy">Flow steps appear once the experience run completes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
