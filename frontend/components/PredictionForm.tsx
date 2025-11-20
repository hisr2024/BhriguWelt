'use client';

import { FormEvent, useState } from "react";
import { requestPrediction } from "@/lib/api";
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
  const [details, setDetails] = useState<BirthDetails>(defaultDetails);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await requestPrediction(engine, details);
      setPayload(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch prediction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <header className="section-heading">
          <p className="eyebrow">Bhrigu Samhita aligned</p>
          <h2>{title}</h2>
          <p className="muted">{description}</p>
        </header>
        <div className="form-grid">
          <div>
            <label htmlFor={`${engine}-name`}>Full name</label>
            <input
              id={`${engine}-name`}
              name="name"
              required
              value={details.name}
              onChange={(event) => setDetails({ ...details, name: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-birth-date`}>Birth date (YYYY-MM-DD)</label>
            <input
              id={`${engine}-birth-date`}
              type="date"
              required
              value={details.birthDate}
              onChange={(event) => setDetails({ ...details, birthDate: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-birth-time`}>Birth time (HH:MM)</label>
            <input
              id={`${engine}-birth-time`}
              type="time"
              required
              value={details.birthTime}
              onChange={(event) => setDetails({ ...details, birthTime: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-birth-place`}>Birth place</label>
            <input
              id={`${engine}-birth-place`}
              required
              value={details.birthPlace}
              onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor={`${engine}-lunar-tithi`}>Lunar tithi</label>
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
            <label htmlFor={`${engine}-moon-element`}>Moon element</label>
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
            <label htmlFor={`${engine}-mars-house`}>Mars house</label>
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
            <label htmlFor={`${engine}-saturn-house`}>Saturn house</label>
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
            <label htmlFor={`${engine}-venus-house`}>Venus house</label>
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
            <label htmlFor={`${engine}-rahu`}>Rahu aspects ascendant</label>
            <select
              id={`${engine}-rahu`}
              value={details.rahuAspectsAscendant ? "yes" : "no"}
              onChange={(event) =>
                setDetails({ ...details, rahuAspectsAscendant: event.target.value === "yes" })
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Consulting Bhrigu..." : "Fetch insights"}
          </button>
          <span className="muted">All guidance references the cited Bhrigu Samhita folios.</span>
        </div>
        {error && <div className="error-banner">{error}</div>}
      </form>
      <PredictionCard title={`${title} result`} payload={payload} />
    </section>
  );
}
