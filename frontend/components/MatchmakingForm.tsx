'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import { requestMatchmaking } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { captureClientError } from "@/lib/telemetry";
import { BirthDetails } from "@/types/astro";
import { useImmersiveFeedback } from "@/lib/immersive";
import PredictionCard from "./PredictionCard";

const defaultDetails: BirthDetails = {
  name: "",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  tradition: "universal",
  lunarTithi: "5",
  moonElement: "water",
  marsHouse: "1",
  saturnHouse: "2",
  venusHouse: "3",
  rahuAspectsAscendant: false,
  ketuHouse: "12",
  mercuryHouse: "5",
  jupiterHouse: "5",
  saturnRetrograde: false,
};

export default function MatchmakingForm() {
  const { t } = useI18n();
  const [primary, setPrimary] = useState<BirthDetails>({ ...defaultDetails });
  const [partner, setPartner] = useState<BirthDetails>({ ...defaultDetails });
  const [modernPreferences, setModernPreferences] = useState("remote-first, research-partnership");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const { triggerSubmitFeedback } = useImmersiveFeedback();

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    triggerSubmitFeedback();
    setError(null);
    setPayload(null);
    setLoading(true);
    try {
      const response = await requestMatchmaking(primary, partner, modernPreferences);
      setPayload(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch compatibility";
      setError(message);
      captureClientError(message, { primary, partner, feature: "matchmaking" });
    } finally {
      setLoading(false);
    }
  };

  const renderInputs = (label: string, details: BirthDetails, setDetails: (next: BirthDetails) => void) => (
    <div className="split-panel">
      <h3 style={{ marginTop: 0 }}>{label}</h3>
      <div className="form-grid">
        <div>
          <label>{t("form.name", "Full name")}</label>
          <input value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} required />
        </div>
        <div>
          <label>{t("form.birthDate", "Birth date (YYYY-MM-DD)")}</label>
          <input type="date" value={details.birthDate} onChange={(event) => setDetails({ ...details, birthDate: event.target.value })} required />
        </div>
        <div>
          <label>{t("form.birthTime", "Birth time (HH:MM)")}</label>
          <input type="time" value={details.birthTime} onChange={(event) => setDetails({ ...details, birthTime: event.target.value })} required />
        </div>
        <div>
          <label>{t("form.birthPlace", "Birth place")}</label>
          <input value={details.birthPlace} onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })} required />
        </div>
        <div>
          <label>{t("form.tradition", "Tradition focus")}</label>
          <select
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
          <label>{t("form.lunarTithi", "Lunar tithi")}</label>
          <input type="number" min={1} max={30} value={details.lunarTithi} onChange={(event) => setDetails({ ...details, lunarTithi: event.target.value })} />
        </div>
        <div>
          <label>{t("form.moonElement", "Moon element")}</label>
          <select value={details.moonElement} onChange={(event) => setDetails({ ...details, moonElement: event.target.value })}>
            <option value="water">Water</option>
            <option value="fire">Fire</option>
            <option value="air">Air</option>
            <option value="earth">Earth</option>
            <option value="ether">Ether</option>
          </select>
        </div>
        <div>
          <label>{t("form.marsHouse", "Mars house")}</label>
          <input type="number" min={1} max={12} value={details.marsHouse} onChange={(event) => setDetails({ ...details, marsHouse: event.target.value })} />
        </div>
        <div>
          <label>{t("form.saturnHouse", "Saturn house")}</label>
          <input type="number" min={1} max={12} value={details.saturnHouse} onChange={(event) => setDetails({ ...details, saturnHouse: event.target.value })} />
        </div>
        <div>
          <label>{t("form.venusHouse", "Venus house")}</label>
          <input type="number" min={1} max={12} value={details.venusHouse} onChange={(event) => setDetails({ ...details, venusHouse: event.target.value })} />
        </div>
        <div>
          <label>{t("form.ketuHouse", "Ketu house (0 if unknown)")}</label>
          <input
            type="number"
            min={0}
            max={12}
            value={details.ketuHouse || "0"}
            onChange={(event) => setDetails({ ...details, ketuHouse: event.target.value })}
          />
        </div>
        <div>
          <label>{t("form.mercuryHouse", "Mercury house (0 if unknown)")}</label>
          <input
            type="number"
            min={0}
            max={12}
            value={details.mercuryHouse || "0"}
            onChange={(event) => setDetails({ ...details, mercuryHouse: event.target.value })}
          />
        </div>
        <div>
          <label>{t("form.jupiterHouse", "Jupiter house (0 if unknown)")}</label>
          <input
            type="number"
            min={0}
            max={12}
            value={details.jupiterHouse || "0"}
            onChange={(event) => setDetails({ ...details, jupiterHouse: event.target.value })}
          />
        </div>
        <div>
          <label>{t("form.rahu", "Rahu aspects ascendant")}</label>
          <select
            value={details.rahuAspectsAscendant ? "yes" : "no"}
            onChange={(event) => setDetails({ ...details, rahuAspectsAscendant: event.target.value === "yes" })}
            aria-label={t("form.rahu", "Rahu aspects ascendant")}
          >
            <option value="no">{t("form.no", "No")}</option>
            <option value="yes">{t("form.yes", "Yes")}</option>
          </select>
        </div>
        <div>
          <label>{t("form.saturnRetrograde", "Saturn retrograde")}</label>
          <select
            value={details.saturnRetrograde ? "yes" : "no"}
            onChange={(event) => setDetails({ ...details, saturnRetrograde: event.target.value === "yes" })}
          >
            <option value="no">{t("form.no", "No")}</option>
            <option value="yes">{t("form.yes", "Yes")}</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <section aria-labelledby="matchmaking-heading">
      <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby="matchmaking-helper">
        <header className="section-heading">
          <p className="eyebrow">Compatibility lab</p>
          <h2 id="matchmaking-heading">{t("pages.matchmaking.title", "Modern Bhrigu matchmaking")}</h2>
          <p className="muted" id="matchmaking-helper">
            {t("form.helper", "Compare two complete birth records plus lifestyle tags to align manuscript and modern signals.")}
          </p>
        </header>
        {renderInputs(t("matchmaking.primary", "Primary"), primary, setPrimary)}
        {renderInputs(t("matchmaking.partner", "Partner"), partner, setPartner)}
        <div style={{ marginTop: "1rem" }}>
          <label>{t("matchmaking.preferences", "Modern preference tags (comma separated)")}</label>
          <input
            value={modernPreferences}
            onChange={(event) => setModernPreferences(event.target.value)}
            placeholder="remote-first, startup-ops, arts-collab"
          />
          <p className="muted" style={{ marginTop: "0.35rem" }}>
            {t("form.accessibility", "Tags are optional but help align manuscript guna scores with compatibility signals.")}
          </p>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading} aria-label={t("pages.matchmaking.title", "Compute compatibility")}> 
            {loading ? t("form.loading", "Evaluating guna...") : t("pages.matchmaking.title", "Compute compatibility")}
          </button>
          <span className="muted">{t("form.accessibility", "Compatibility indices blend sutra guidance with modern priorities.")}</span>
        </div>
        {error && (
          <div className="error-banner" role="alert" aria-live="assertive" tabIndex={-1} ref={errorRef}>
            {t("form.error", error)}
          </div>
        )}
      </form>
      <PredictionCard title="Matchmaking result" payload={payload} engine="matchmaking" />
    </section>
  );
}
