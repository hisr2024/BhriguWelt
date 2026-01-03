'use client';

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import BackendHealthNotice from "@/components/BackendHealthNotice";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { loadBirthDetails, onBirthDetails, saveBirthDetails } from "@/lib/birthStorage";
import { requestCoreWisdom } from "@/lib/api";
import { useImmersiveFeedback } from "@/lib/immersive";
import type { BirthDetails, ChartHouse, CoreWisdomRemedy, DashaPeriod } from "@/types/astro";

const KundliCharts = dynamic(() => import("@/components/KundliCharts"), { ssr: false });

type CoreWisdomResponse = {
  sections?: Record<string, string>;
  remedies?: CoreWisdomRemedy[];
  rashi_chart?: ChartHouse[];
  bhava_chart?: ChartHouse[];
  dashas?: DashaPeriod[];
  karmic_epoch?: string;
  manuscript_wisdom?: string[];
  sources?: string[];
};

type Props = {
  title: string;
  description: string;
  focusAreas?: string[];
  eyebrow?: string;
};

export default function CoreWisdomPanel({ title, description, focusAreas = [], eyebrow = "Core wisdom" }: Props) {
  const [details, setDetails] = useState<BirthDetails>({ ...DEFAULT_BIRTH_DETAILS });
  const [payload, setPayload] = useState<CoreWisdomResponse | null>(null);
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

  const focusLabel = useMemo(() => (focusAreas.length ? focusAreas.join(", ") : "general life balance"), [focusAreas]);

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
    if (payloadToValidate.lunarTithi && (!/^\d+$/.test(payloadToValidate.lunarTithi) || Number(payloadToValidate.lunarTithi) > 30)) {
      return "Lunar tithi must be 1-30.";
    }
    if (
      payloadToValidate.moonElement &&
      !["water", "fire", "air", "earth", "ether"].includes(payloadToValidate.moonElement.toLowerCase())
    ) {
      return "Use water, fire, air, earth, or ether for moon element.";
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
      const response = (await requestCoreWisdom(details, focusAreas)) as CoreWisdomResponse;
      setPayload(response);
      saveBirthDetails(details, { autoSubmit: true });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("bhrigu:open-chat", {
            detail: {
              details: {
                name: details.name,
                dateOfBirth: details.birthDate,
                timeOfBirth: details.birthTime,
                placeOfBirth: details.birthPlace,
              },
            },
          }),
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch core wisdom";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const sections = useMemo(() => Object.entries(payload?.sections ?? {}), [payload?.sections]);
  const remedies = payload?.remedies ?? [];

  return (
    <section aria-labelledby="core-wisdom-heading" className="core-wisdom">
      <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby="core-wisdom-helper">
        <header className="section-heading">
          <p className="eyebrow">{eyebrow}</p>
          <h2 id="core-wisdom-heading">{title}</h2>
          <p className="muted" id="core-wisdom-helper">
            {description} Focus: {focusLabel}.
          </p>
          <BackendHealthNotice />
        </header>
        <div className="form-grid">
          <div>
            <label htmlFor="core-name">Full name</label>
            <input
              id="core-name"
              name="name"
              required
              value={details.name}
              onChange={(event) => setDetails({ ...details, name: event.target.value })}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="core-birth-date">Birth date (YYYY-MM-DD)</label>
            <input
              id="core-birth-date"
              type="date"
              required
              value={details.birthDate}
              onChange={(event) => setDetails({ ...details, birthDate: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="core-birth-time">Birth time (HH:MM)</label>
            <input
              id="core-birth-time"
              type="time"
              required
              value={details.birthTime}
              onChange={(event) => setDetails({ ...details, birthTime: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="core-birth-place">Birth place</label>
            <input
              id="core-birth-place"
              required
              value={details.birthPlace}
              onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="core-lunar">Lunar tithi (1-30)</label>
            <input
              id="core-lunar"
              value={details.lunarTithi}
              onChange={(event) => setDetails({ ...details, lunarTithi: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="core-element">Moon element</label>
            <input
              id="core-element"
              value={details.moonElement}
              onChange={(event) => setDetails({ ...details, moonElement: event.target.value })}
              placeholder="water, fire, air, earth, ether"
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading} className="ghost-button">
            {loading ? "Consulting folios..." : "Generate core wisdom"}
          </button>
          <span className="badge">Operational — synced with core engine</span>
        </div>
        {error ? (
          <div className="error-banner" role="alert" aria-live="assertive" tabIndex={-1} ref={errorRef}>
            {error}
          </div>
        ) : null}
      </form>

      <div className="core-wisdom__results" aria-live="polite">
        {payload ? (
          <>
            <div className="section-card">
              <div className="section-card__glow" aria-hidden />
              <div className="section-card__header">
                <h3>Core narrative</h3>
                <span className="pill ghost">Karmic epoch</span>
              </div>
              <p className="muted">{payload.karmic_epoch || "Karmic epoch unlocks once the folios align."}</p>
            </div>
            <div className="insight-grid">
              {sections.length ? (
                sections.map(([heading, text]) => (
                  <article key={heading} className="insight-pill">
                    <strong>{heading}</strong>
                    <p className="microcopy">{text}</p>
                  </article>
                ))
              ) : (
                <article className="insight-pill">
                  <strong>Awaiting sections</strong>
                  <p className="microcopy">Run the reading to populate focus-area guidance.</p>
                </article>
              )}
            </div>
            <div className="section-card">
              <div className="section-card__header">
                <h3>Remedies & rituals</h3>
                <span className="pill">Curated</span>
              </div>
              <div className="mini-grid">
                {remedies.length ? (
                  remedies.map((remedy, index) => (
                    <article key={`${remedy.sutra_reference || "remedy"}-${index}`} className="mini-card">
                      <strong>{remedy.sutra_reference || "Manuscript guidance"}</strong>
                      <p className="microcopy">{remedy.description || remedy.interpretation}</p>
                    </article>
                  ))
                ) : (
                  <article className="mini-card">
                    <strong>Remedies loading</strong>
                    <p className="microcopy">Remedies appear after the folios compile.</p>
                  </article>
                )}
              </div>
            </div>
            <div className="section-card">
              <div className="section-card__header">
                <h3>Chart foundation</h3>
                <span className="pill">Interactive</span>
              </div>
              <KundliCharts
                rashiChart={payload.rashi_chart}
                bhavaChart={payload.bhava_chart}
                dashas={payload.dashas}
              />
            </div>
          </>
        ) : (
          <div className="section-card">
            <div className="section-card__glow" aria-hidden />
            <div className="section-card__header">
              <h3>Core wisdom results</h3>
              <span className="pill ghost">Awaiting input</span>
            </div>
            <p className="muted">Provide birth details to unlock remedies, sections, and chart overlays.</p>
          </div>
        )}
      </div>
    </section>
  );
}
