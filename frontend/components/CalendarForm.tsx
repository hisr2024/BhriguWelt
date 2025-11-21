'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import { requestCalendar } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { captureClientError } from "@/lib/telemetry";
import { CalendarDetails } from "@/types/astro";
import { helperCopy } from "@/lib/copy";
import PredictionCard from "./PredictionCard";

export default function CalendarForm() {
  const { t } = useI18n();
  const helperText = helperCopy.calendar;
  const [details, setDetails] = useState<CalendarDetails>({
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
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
      const response = await requestCalendar(details);
      setPayload(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to convert date";
      setError(message);
      captureClientError(message, { details, feature: "calendar" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="calendar-heading">
      <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby="calendar-helper">
        <header className="section-heading">
          <p className="eyebrow">Śaka conversion</p>
          <h2 id="calendar-heading">{t("calendar.title", "Gregorian → Śaka calendar conversion")}</h2>
          <p className="muted" id="calendar-helper">
            {t("calendar.helper", helperText)}
          </p>
        </header>
        <div className="form-grid">
          <div>
            <label htmlFor="calendar-birth-date">{t("form.birthDate", "Birth date (YYYY-MM-DD)")}</label>
            <input
              id="calendar-birth-date"
              type="date"
              required
              value={details.birthDate}
              onChange={(event) => setDetails({ ...details, birthDate: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="calendar-birth-time">{t("form.birthTime", "Birth time (HH:MM)")}</label>
            <input
              id="calendar-birth-time"
              type="time"
              required
              value={details.birthTime}
              onChange={(event) => setDetails({ ...details, birthTime: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="calendar-birth-place">{t("form.birthPlace", "Birth place")}</label>
            <input
              id="calendar-birth-place"
              required
              value={details.birthPlace}
              onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading} aria-label={t("calendar.title", "Convert Gregorian birth details to Śaka")}> 
            {loading ? t("form.loading", "Consulting Bhrigu...") : t("calendar.title", "Convert Gregorian birth details to Śaka")}
          </button>
        </div>
        {error && (
          <div className="error-banner" role="alert" aria-live="assertive" tabIndex={-1} ref={errorRef}>
            {t("form.error", error)}
          </div>
        )}
      </form>
      <PredictionCard title="Calendar context" payload={payload} />
    </section>
  );
}
