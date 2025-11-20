'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import { requestPrediction } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { captureClientError } from "@/lib/telemetry";
import { BirthDetails, PredictionEngine } from "@/types/astro";
import PredictionCard from "./PredictionCard";

const defaultDetails: BirthDetails = {
  name: "",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  lunarTithi: "5",
  moonElement: "water",
  marsHouse: "1",
  saturnHouse: "2",
  venusHouse: "3",
  rahuAspectsAscendant: false,
};

interface Props {
  engine: PredictionEngine;
  title: string;
  description: string;
}

export default function PredictionForm({ engine, title, description }: Props) {
  const { t } = useI18n();
  const [details, setDetails] = useState<BirthDetails>(defaultDetails);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPayload(null);
    setLoading(true);
    try {
      const response = await requestPrediction(engine, details);
      setPayload(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch prediction";
      setError(message);
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
      <PredictionCard title={`${title} result`} payload={payload} />
    </section>
  );
}
