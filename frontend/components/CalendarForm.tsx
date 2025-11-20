'use client';

import { FormEvent, useState } from "react";
import { requestCalendar } from "@/lib/api";
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
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
      <form onSubmit={handleSubmit}>
        <header style={{ marginBottom: "1rem" }}>
          <h2>Gregorian → Śaka calendar conversion</h2>
          <p>Every onboarding flow can derive Śaka year, month, and IST reference for downstream predictions.</p>
        </header>
        <div className="form-grid">
          <div>
            <label>Birth date</label>
            <input type="date" required value={details.birthDate} onChange={(event) => setDetails({ ...details, birthDate: event.target.value })} />
          </div>
          <div>
            <label>Birth time</label>
            <input type="time" required value={details.birthTime} onChange={(event) => setDetails({ ...details, birthTime: event.target.value })} />
          </div>
          <div>
            <label>Birth place</label>
            <input required value={details.birthPlace} onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })} />
          </div>
        </div>
        <div style={{ marginTop: "1.25rem" }}>
          <button type="submit" disabled={loading}>
            {loading ? "Referencing pañchāṅga..." : "Convert"}
          </button>
        </div>
        {error && <div className="error-banner">{error}</div>}
      </form>
      <PredictionCard title="Calendar context" payload={payload} />
    </section>
  );
}
