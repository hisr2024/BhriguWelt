'use client';

import { FormEvent, useState } from "react";
import { requestCalendar } from "@/lib/api";
import { getCopy, type Locale } from "@/lib/i18n";
import { CalendarDetails } from "@/types/astro";
import PredictionCard from "./PredictionCard";

export default function CalendarForm() {
  const [details, setDetails] = useState<CalendarDetails>({
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const copy = getCopy(process.env.NEXT_PUBLIC_LOCALE as Locale | undefined);
  const helperId = "calendar-helper";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPayload(null);
    setLoading(true);
    try {
      const response = await requestCalendar(details);
      setPayload(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to convert date");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <form onSubmit={handleSubmit} aria-describedby={helperId} aria-busy={loading}>
        <header className="section-heading">
          <p className="eyebrow">Calendar alignment</p>
          <h2>Gregorian → Śaka calendar conversion</h2>
          <p className="muted">
            Every onboarding flow can derive Śaka year, month, and IST reference for downstream predictions.
            Use 24-hour birth times for accurate IST normalization.
          </p>
        </header>
        <div className="form-grid">
          <div>
            <label htmlFor="calendar-birth-date">Birth date</label>
            <input
              id="calendar-birth-date"
              type="date"
              required
              value={details.birthDate}
              aria-label="Birth date"
              onChange={(event) => setDetails({ ...details, birthDate: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="calendar-birth-time">Birth time</label>
            <input
              id="calendar-birth-time"
              type="time"
              required
              value={details.birthTime}
              aria-label="Birth time"
              onChange={(event) => setDetails({ ...details, birthTime: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="calendar-birth-place">Birth place</label>
            <input
              id="calendar-birth-place"
              required
              aria-label="Birth place"
              value={details.birthPlace}
              onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Referencing pañchāṅga..." : "Convert"}
          </button>
        </div>
        <p id={helperId} className="muted" style={{ marginTop: "0.25rem" }}>
          {copy.accessibility.formHelper}
        </p>
        {error && (
          <div className="error-banner" role="alert" aria-live="assertive">
            {copy.accessibility.errorPrefix} {error}
          </div>
        )}
      </form>
      <PredictionCard title="Calendar context" payload={payload} />
    </section>
  );
}
