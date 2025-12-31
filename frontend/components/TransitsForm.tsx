'use client';

import { FormEvent, useEffect, useRef, useState } from "react";

import BackendHealthNotice from "@/components/BackendHealthNotice";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { loadBirthDetails, onBirthDetails, saveBirthDetails } from "@/lib/birthStorage";
import { requestTransits } from "@/lib/api";
import { useImmersiveFeedback } from "@/lib/immersive";
import type { BirthDetails } from "@/types/astro";

const buildDefaultTransit = () => {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`,
  };
};

type TransitDirective = {
  planet?: string;
  influence?: string;
  certainty?: number;
  reference?: string;
};

type TransitResponse = {
  name?: string;
  directives?: TransitDirective[];
  symbolic_directives?: string[];
  remedies?: { description?: string; sutra_reference?: string }[];
  citations?: string[];
  interpretation?: string;
};

export default function TransitsForm() {
  const [details, setDetails] = useState<BirthDetails>({ ...DEFAULT_BIRTH_DETAILS });
  const [transitDate, setTransitDate] = useState(buildDefaultTransit().date);
  const [transitTime, setTransitTime] = useState(buildDefaultTransit().time);
  const [timezone, setTimezone] = useState(
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
  );
  const [payload, setPayload] = useState<TransitResponse | null>(null);
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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(transitDate)) {
      setLoading(false);
      setError("Transit date must be YYYY-MM-DD.");
      return;
    }
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(transitTime)) {
      setLoading(false);
      setError("Transit time must be HH:MM.");
      return;
    }

    try {
      const response = (await requestTransits(details, {
        transitDate,
        transitTime,
        timezone,
      })) as TransitResponse;
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
      const message = err instanceof Error ? err.message : "Unable to fetch transits";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="transits-heading" className="transits">
      <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby="transits-helper">
        <header className="section-heading">
          <p className="eyebrow">Live transit overlay</p>
          <h2 id="transits-heading">Real-time transit guidance</h2>
          <p className="muted" id="transits-helper">
            Align natal houses with current sky movements to surface tactical recommendations.
          </p>
          <BackendHealthNotice />
        </header>
        <div className="form-grid">
          <div>
            <label htmlFor="transit-name">Full name</label>
            <input
              id="transit-name"
              name="name"
              required
              value={details.name}
              onChange={(event) => setDetails({ ...details, name: event.target.value })}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="transit-birth-date">Birth date (YYYY-MM-DD)</label>
            <input
              id="transit-birth-date"
              type="date"
              required
              value={details.birthDate}
              onChange={(event) => setDetails({ ...details, birthDate: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="transit-birth-time">Birth time (HH:MM)</label>
            <input
              id="transit-birth-time"
              type="time"
              required
              value={details.birthTime}
              onChange={(event) => setDetails({ ...details, birthTime: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="transit-birth-place">Birth place</label>
            <input
              id="transit-birth-place"
              required
              value={details.birthPlace}
              onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="transit-date">Transit date</label>
            <input
              id="transit-date"
              type="date"
              required
              value={transitDate}
              onChange={(event) => setTransitDate(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="transit-time">Transit time</label>
            <input
              id="transit-time"
              type="time"
              required
              value={transitTime}
              onChange={(event) => setTransitTime(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="transit-timezone">Timezone</label>
            <input
              id="transit-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="Asia/Kolkata"
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading} className="ghost-button">
            {loading ? "Calibrating orbits..." : "Generate transit overlay"}
          </button>
          <span className="badge">Operational — synced with transit engine</span>
        </div>
        {error ? (
          <div className="error-banner" role="alert" aria-live="assertive" tabIndex={-1} ref={errorRef}>
            {error}
          </div>
        ) : null}
      </form>

      <div className="transits__results" aria-live="polite">
        {payload ? (
          <>
            <div className="section-card">
              <div className="section-card__glow" aria-hidden />
              <div className="section-card__header">
                <h3>Transit interpretation</h3>
                <span className="pill">{payload.name || "Live now"}</span>
              </div>
              <p className="muted">
                {payload.interpretation || "Transit interpretation will appear once the engine completes."}
              </p>
            </div>
            <div className="insight-grid">
              {(payload.directives || []).length ? (
                (payload.directives || []).map((directive, index) => (
                  <article key={`${directive.planet || "planet"}-${index}`} className="insight-pill">
                    <strong>{directive.planet || "Planet"} transit</strong>
                    <p className="microcopy">{directive.influence}</p>
                    <p className="microcopy">Certainty: {Math.round((directive.certainty || 0) * 100)}%</p>
                    {directive.reference ? <p className="microcopy">Source: {directive.reference}</p> : null}
                  </article>
                ))
              ) : (
                <article className="insight-pill">
                  <strong>Awaiting directives</strong>
                  <p className="microcopy">Submit birth and transit timing to populate the transit map.</p>
                </article>
              )}
            </div>
            <div className="section-card">
              <div className="section-card__header">
                <h3>Remedies for this window</h3>
                <span className="pill ghost">Aligned</span>
              </div>
              <div className="mini-grid">
                {(payload.remedies || []).length ? (
                  (payload.remedies || []).map((remedy, index) => (
                    <article key={`${remedy.sutra_reference || "remedy"}-${index}`} className="mini-card">
                      <strong>{remedy.sutra_reference || "Remedy"}</strong>
                      <p className="microcopy">{remedy.description}</p>
                    </article>
                  ))
                ) : (
                  <article className="mini-card">
                    <strong>Remedies pending</strong>
                    <p className="microcopy">Remedy prompts appear after the transit directives load.</p>
                  </article>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="section-card">
            <div className="section-card__glow" aria-hidden />
            <div className="section-card__header">
              <h3>Transit snapshot</h3>
              <span className="pill ghost">Awaiting input</span>
            </div>
            <p className="muted">Provide natal and transit timing to unlock real-time guidance.</p>
          </div>
        )}
      </div>
    </section>
  );
}
