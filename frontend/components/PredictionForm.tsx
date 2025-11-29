'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import { requestPrediction } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { captureClientError } from "@/lib/telemetry";
import { useImmersiveFeedback } from "@/lib/immersive";
import { BirthDetails, PredictionEngine } from "@/types/astro";
import PredictionCard from "./PredictionCard";
import BackendHealthNotice from "@/components/BackendHealthNotice";
import { loadBirthDetails, onBirthDetails } from "@/lib/birthStorage";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";

const MAX_RETRIES = 2;

interface Props {
  engine: PredictionEngine;
  title: string;
  description: string;
  onRequestStart?: () => void;
  onResult?: (payload: unknown) => void;
}

export default function PredictionForm({ engine, title, description, onRequestStart, onResult }: Props) {
  const { t } = useI18n();
  const [details, setDetails] = useState<BirthDetails>({ ...DEFAULT_BIRTH_DETAILS });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const lastSuccessfulPayloadRef = useRef<unknown>(null);
  const { triggerSubmitFeedback } = useImmersiveFeedback();

  useEffect(() => {
    const stored = loadBirthDetails();
    if (stored) {
      setDetails((prev) => ({ ...prev, ...stored }));
    }

    const unsubscribe = onBirthDetails((payload) => {
      setDetails((prev) => ({ ...prev, ...payload }));
      if (engine === "horoscope" && payload.autoSubmit) {
        setInfo(t("form.autosubmit", "Submitting horoscope with fresh birth details…"));
        void handleSubmit();
      }
    });

    return () => unsubscribe();
  }, [engine, t]);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const validateDetails = (payload: BirthDetails): string | null => {
    if (!payload.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(payload.birthDate)) {
      return t("form.error.birthDate", "Use YYYY-MM-DD between 1900-2100.");
    }
    if (!payload.birthTime || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(payload.birthTime)) {
      return t("form.error.birthTime", "Use HH:MM in 24h format (e.g., 07:45)");
    }
    if (!payload.birthPlace || payload.birthPlace.length < 3 || !payload.birthPlace.includes(",")) {
      return t("form.error.birthPlace", "Add city and country (e.g., Jaipur, Bharat)");
    }
    if (payload.lunarTithi && (!/^\d+$/.test(payload.lunarTithi) || Number(payload.lunarTithi) > 30)) {
      return t("form.error.lunarTithi", "Lunar tithi must be 1-30.");
    }
    if (
      payload.moonElement &&
      !["water", "fire", "air", "earth", "ether"].includes(payload.moonElement.toLowerCase())
    ) {
      return t("form.error.moonElement", "Use water, fire, air, earth, or ether for moon element.");
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    triggerSubmitFeedback();
    setError(null);
    setInfo(null);
    setRetryAttempts(0);
    setPayload(null);
    onRequestStart?.();
    setLoading(true);
    const isOffline = typeof navigator !== "undefined" && navigator && !navigator.onLine;

    const validationIssue = validateDetails(details);
    if (validationIssue) {
      setLoading(false);
      setError(validationIssue);
      return;
    }

    if (isOffline) {
      setLoading(false);
      setError("Offline detected. Reconnect or retry to refresh predictions.");
      if (lastSuccessfulPayloadRef.current) {
        setInfo("Showing last available guidance while offline.");
        setPayload(lastSuccessfulPayloadRef.current);
      }
      return;
    }

    const requestWithRetry = async () => {
      let attempt = 0;
      let lastError: unknown;
      while (attempt <= MAX_RETRIES) {
        try {
          const data = await requestPrediction(engine, details);
          return { data, attempts: attempt };
        } catch (err) {
          lastError = err;
          const message = err instanceof Error ? err.message : "";
          const networkIssue = err instanceof TypeError || /network/i.test(message);
          if (networkIssue && attempt < MAX_RETRIES) {
            attempt += 1;
            setRetryAttempts(attempt);
            await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
            continue;
          }
          throw err;
        }
      }
      throw lastError ?? new Error("Unable to fetch prediction");
    };

    try {
      const { data, attempts } = await requestWithRetry();
      setPayload(data);
      onResult?.(data);
      lastSuccessfulPayloadRef.current = data;
      if (attempts > 0) {
        setInfo(`Completed after ${attempts + 1} attempts.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch prediction";
      setError(message);
      if (lastSuccessfulPayloadRef.current) {
        setInfo("Showing last available guidance while we retry later.");
        setPayload(lastSuccessfulPayloadRef.current);
      }
      captureClientError(message, { engine, details });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby={`${engine}-heading`}>
      <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby={`${engine}-helper`}>
        <header className="section-heading">
          <p className="eyebrow">{t("form.subtitle", "Bhrigu Samhita aligned")}</p>
          <h2 id={`${engine}-heading`}>{title}</h2>
          <p className="muted" id={`${engine}-helper`}>
            {description || t("form.helper", "Complete every detail to keep remedies precise.")}
          </p>
          <BackendHealthNotice />
          {retryAttempts > 0 ? (
            <p className="microcopy" aria-live="polite">
              Retrying... attempt {retryAttempts + 1} of {MAX_RETRIES + 1}
            </p>
          ) : null}
          {info ? (
            <p className="microcopy" aria-live="polite">{info}</p>
          ) : null}
        </header>
        <div className="form-grid">
          <div>
            <label htmlFor={`${engine}-name`}>{t("form.name", "Full name")}</label>
            <input
              id={`${engine}-name`}
              name="name"
              required
              value={details.name}
              onChange={(event) => setDetails({ ...details, name: event.target.value })}
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor={`${engine}-birth-date`}>{t("form.birthDate", "Birth date (YYYY-MM-DD)")}</label>
            <input
              id={`${engine}-birth-date`}
              type="date"
              required
              value={details.birthDate}
              onChange={(event) => setDetails({ ...details, birthDate: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-birth-time`}>{t("form.birthTime", "Birth time (HH:MM)")}</label>
            <input
              id={`${engine}-birth-time`}
              type="time"
              required
              value={details.birthTime}
              onChange={(event) => setDetails({ ...details, birthTime: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-birth-place`}>{t("form.birthPlace", "Birth place")}</label>
            <input
              id={`${engine}-birth-place`}
              required
              value={details.birthPlace}
              onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-tradition`}>{t("form.tradition", "Tradition focus")}</label>
            <select
              id={`${engine}-tradition`}
              value={details.tradition || "universal"}
              onChange={(event) => setDetails({ ...details, tradition: event.target.value })}
            >
              <option value="universal">{t("tradition.universal", "Universal")}</option>
              <option value="northern">{t("tradition.northern", "Northern")}</option>
              <option value="southern-grantha">{t("tradition.southern", "Southern (Grantha)")}</option>
              <option value="western-grantha">{t("tradition.western", "Western Grantha")}</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${engine}-lunar-tithi`}>{t("form.lunarTithi", "Lunar tithi")}</label>
            <input
              id={`${engine}-lunar-tithi`}
              type="number"
              min={1}
              max={30}
              value={details.lunarTithi}
              onChange={(event) => setDetails({ ...details, lunarTithi: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-moon-element`}>{t("form.moonElement", "Moon element")}</label>
            <select
              id={`${engine}-moon-element`}
              value={details.moonElement}
              onChange={(event) => setDetails({ ...details, moonElement: event.target.value })}
            >
              <option value="water">Water</option>
              <option value="fire">Fire</option>
              <option value="air">Air</option>
              <option value="earth">Earth</option>
              <option value="ether">Ether</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${engine}-mars-house`}>{t("form.marsHouse", "Mars house")}</label>
            <input
              id={`${engine}-mars-house`}
              type="number"
              min={1}
              max={12}
              value={details.marsHouse}
              onChange={(event) => setDetails({ ...details, marsHouse: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-saturn-house`}>{t("form.saturnHouse", "Saturn house")}</label>
            <input
              id={`${engine}-saturn-house`}
              type="number"
              min={1}
              max={12}
              value={details.saturnHouse}
              onChange={(event) => setDetails({ ...details, saturnHouse: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-venus-house`}>{t("form.venusHouse", "Venus house")}</label>
            <input
              id={`${engine}-venus-house`}
              type="number"
              min={1}
              max={12}
              value={details.venusHouse}
              onChange={(event) => setDetails({ ...details, venusHouse: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-ketu-house`}>{t("form.ketuHouse", "Ketu house (0 if unknown)")}</label>
            <input
              id={`${engine}-ketu-house`}
              type="number"
              min={0}
              max={12}
              value={details.ketuHouse || "0"}
              onChange={(event) => setDetails({ ...details, ketuHouse: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-mercury-house`}>{t("form.mercuryHouse", "Mercury house (0 if unknown)")}</label>
            <input
              id={`${engine}-mercury-house`}
              type="number"
              min={0}
              max={12}
              value={details.mercuryHouse || "0"}
              onChange={(event) => setDetails({ ...details, mercuryHouse: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-jupiter-house`}>{t("form.jupiterHouse", "Jupiter house (0 if unknown)")}</label>
            <input
              id={`${engine}-jupiter-house`}
              type="number"
              min={0}
              max={12}
              value={details.jupiterHouse || "0"}
              onChange={(event) => setDetails({ ...details, jupiterHouse: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-rahu`}>{t("form.rahu", "Rahu aspects ascendant")}</label>
            <select
              id={`${engine}-rahu`}
              value={details.rahuAspectsAscendant ? "yes" : "no"}
              onChange={(event) =>
                setDetails({ ...details, rahuAspectsAscendant: event.target.value === "yes" })
              }
              aria-label={t("form.rahu", "Rahu aspects ascendant")}
            >
              <option value="no">{t("form.no", "No")}</option>
              <option value="yes">{t("form.yes", "Yes")}</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${engine}-saturn-retrograde`}>{t("form.saturnRetrograde", "Saturn retrograde")}</label>
            <select
              id={`${engine}-saturn-retrograde`}
              value={details.saturnRetrograde ? "yes" : "no"}
              onChange={(event) => setDetails({ ...details, saturnRetrograde: event.target.value === "yes" })}
            >
              <option value="no">{t("form.no", "No")}</option>
              <option value="yes">{t("form.yes", "Yes")}</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading} aria-label={t("form.submit", "Fetch insights")}>
            {loading ? t("form.loading", "Consulting Bhrigu...") : t("form.submit", "Fetch insights")}
          </button>
          <span className="muted">{t("form.accessibility", "All guidance references the cited Bhrigu Samhita folios.")}</span>
        </div>
        {error && (
          <div className="error-banner" role="alert" aria-live="assertive" tabIndex={-1} ref={errorRef}>
            {t("form.error", error)}
          </div>
        )}
      </form>
      <PredictionCard title={`${title} result`} payload={payload} engine={engine} seekerName={details.name} />
    </section>
  );
}
