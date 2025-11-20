'use client';

import { FormEvent, useState } from "react";
import { requestMatchmaking } from "@/lib/api";
import { BirthDetails } from "@/types/astro";
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

export default function MatchmakingForm() {
  const [primary, setPrimary] = useState<BirthDetails>({ ...defaultDetails });
  const [partner, setPartner] = useState<BirthDetails>({ ...defaultDetails });
  const [modernPreferences, setModernPreferences] = useState("remote-first, research-partnership");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await requestMatchmaking(primary, partner, modernPreferences);
      setPayload(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch compatibility");
    } finally {
      setLoading(false);
    }
  };

  const renderInputs = (label: string, details: BirthDetails, setDetails: (next: BirthDetails) => void) => (
    <div style={{ border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "1rem" }}>
      <h3 style={{ marginTop: 0 }}>{label}</h3>
      <div className="form-grid">
        <div>
          <label>Full name</label>
          <input value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} required />
        </div>
        <div>
          <label>Birth date</label>
          <input type="date" value={details.birthDate} onChange={(event) => setDetails({ ...details, birthDate: event.target.value })} required />
        </div>
        <div>
          <label>Birth time</label>
          <input type="time" value={details.birthTime} onChange={(event) => setDetails({ ...details, birthTime: event.target.value })} required />
        </div>
        <div>
          <label>Birth place</label>
          <input value={details.birthPlace} onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })} required />
        </div>
        <div>
          <label>Lunar tithi</label>
          <input type="number" min={1} max={30} value={details.lunarTithi} onChange={(event) => setDetails({ ...details, lunarTithi: event.target.value })} />
        </div>
        <div>
          <label>Moon element</label>
          <select value={details.moonElement} onChange={(event) => setDetails({ ...details, moonElement: event.target.value })}>
            <option value="water">Water</option>
            <option value="fire">Fire</option>
            <option value="air">Air</option>
            <option value="earth">Earth</option>
            <option value="ether">Ether</option>
          </select>
        </div>
        <div>
          <label>Mars house</label>
          <input type="number" min={1} max={12} value={details.marsHouse} onChange={(event) => setDetails({ ...details, marsHouse: event.target.value })} />
        </div>
        <div>
          <label>Saturn house</label>
          <input type="number" min={1} max={12} value={details.saturnHouse} onChange={(event) => setDetails({ ...details, saturnHouse: event.target.value })} />
        </div>
        <div>
          <label>Venus house</label>
          <input type="number" min={1} max={12} value={details.venusHouse} onChange={(event) => setDetails({ ...details, venusHouse: event.target.value })} />
        </div>
        <div>
          <label>Rahu aspects ascendant</label>
          <select
            value={details.rahuAspectsAscendant ? "yes" : "no"}
            onChange={(event) => setDetails({ ...details, rahuAspectsAscendant: event.target.value === "yes" })}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <section>
      <form onSubmit={handleSubmit}>
        <header style={{ marginBottom: "1rem" }}>
          <h2>Modern Bhrigu matchmaking</h2>
          <p>Compare two complete Bhrigu Samhita birth records plus contemporary lifestyle tags.</p>
        </header>
        {renderInputs("Primary", primary, setPrimary)}
        {renderInputs("Partner", partner, setPartner)}
        <div style={{ marginTop: "1rem" }}>
          <label>Modern preference tags (comma separated)</label>
          <input
            value={modernPreferences}
            onChange={(event) => setModernPreferences(event.target.value)}
            placeholder="remote-first, startup-ops, arts-collab"
          />
        </div>
        <div style={{ marginTop: "1.25rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button type="submit" disabled={loading}>
            {loading ? "Evaluating guna..." : "Compute compatibility"}
          </button>
          <span style={{ color: "#475569" }}>
            Compatibility indices blend sutra guidance with modern priorities.
          </span>
        </div>
        {error && <div className="error-banner">{error}</div>}
      </form>
      <PredictionCard title="Matchmaking result" payload={payload} />
    </section>
  );
}
