'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import { requestMatchmaking } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { captureClientError } from "@/lib/telemetry";
import { BirthDetails } from "@/types/astro";
import { useImmersiveFeedback } from "@/lib/immersive";
import PredictionCard from "./PredictionCard";
import BackendHealthNotice from "@/components/BackendHealthNotice";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { loadBirthDetails, onBirthDetails } from "@/lib/birthStorage";

export default function MatchmakingForm() {
  const { t } = useI18n();
  const [primary, setPrimary] = useState<BirthDetails>({ ...DEFAULT_BIRTH_DETAILS });
  const [partner, setPartner] = useState<BirthDetails>({ ...DEFAULT_BIRTH_DETAILS });
  const [modernPreferences, setModernPreferences] = useState("remote-first, research-partnership");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [chartsReady, setChartsReady] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const { triggerSubmitFeedback } = useImmersiveFeedback();

  const hasBirthDetails = (details: BirthDetails) =>
    Boolean(details.name && details.birthDate && details.birthTime && details.birthPlace);

  const validateDetails = (details: BirthDetails) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(details.birthDate)) return t("form.error.birthDate", "Use YYYY-MM-DD between 1900-2100.");
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(details.birthTime)) return t("form.error.birthTime", "Use HH:MM in 24h format (e.g., 07:45)");
    if (!details.birthPlace.includes(",")) return t("form.error.birthPlace", "Add city and country (e.g., Jaipur, Bharat)");
    if (details.lunarTithi && (!/^\d+$/.test(details.lunarTithi) || Number(details.lunarTithi) > 30)) {
      return t("form.error.lunarTithi", "Lunar tithi must be 1-30.");
    }
    if (
      details.moonElement &&
      !["water", "fire", "air", "earth", "ether"].includes(details.moonElement.toLowerCase())
    ) {
      return t("form.error.moonElement", "Use water, fire, air, earth, or ether for moon element.");
    }
    return null;
  };

  useEffect(() => {
    setChartsReady(hasBirthDetails(primary) && hasBirthDetails(partner));
  }, [primary, partner]);

  useEffect(() => {
    const stored = loadBirthDetails();
    if (stored && hasBirthDetails({ ...primary, ...stored })) {
      setPrimary((prev) => ({ ...prev, ...stored }));
    }

    const unsubscribe = onBirthDetails((payload) => {
      setPrimary((prev) => ({ ...prev, ...payload }));
    });

    return () => unsubscribe();
  }, []);

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
    if (!chartsReady) {
      setError(
        t(
          "matchmaking.requireCharts",
          "Please complete both profiles so we can generate each chart before calculating compatibility.",
        ),
      );
      return;
    }
    const primaryIssue = validateDetails(primary);
    const partnerIssue = validateDetails(partner);
    if (primaryIssue || partnerIssue) {
      setError(primaryIssue || partnerIssue);
      return;
    }
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
          <BackendHealthNotice />
        </header>
        <div className="duo-overlay" role="status" aria-live="polite">
          <div className={`duo-overlay__orb ${hasBirthDetails(primary) ? "duo-overlay__orb--ready" : ""}`}>
            <span className="duo-overlay__label">{primary.name || t("matchmaking.primary", "Primary chart")}</span>
            <span className="duo-overlay__energy">Solar flow</span>
          </div>
          <div className="duo-overlay__merge">
            <p className="microcopy">
              {chartsReady
                ? t(
                    "matchmaking.overlayReady",
                    "Dual charts locked. Compatibility overlays will blend guna and lifestyle energies.",
                  )
                : t("matchmaking.overlayLocked", "Enter both charts to unlock the layered aura preview.")}
            </p>
            <div className="duo-overlay__auras" aria-hidden>
              <span
                className={`duo-overlay__aura duo-overlay__aura--left ${hasBirthDetails(primary) ? "duo-overlay__aura--active" : ""}`}
              />
              <span
                className={`duo-overlay__aura duo-overlay__aura--right ${hasBirthDetails(partner) ? "duo-overlay__aura--active" : ""}`}
              />
              <span
                className={`duo-overlay__aura duo-overlay__aura--center ${chartsReady ? "duo-overlay__aura--active" : ""}`}
              />
            </div>
          </div>
          <div className={`duo-overlay__orb ${hasBirthDetails(partner) ? "duo-overlay__orb--ready" : ""}`}>
            <span className="duo-overlay__label">{partner.name || t("matchmaking.partner", "Partner chart")}</span>
            <span className="duo-overlay__energy">Lunar flow</span>
          </div>
        </div>
        {renderInputs(t("matchmaking.primary", "Primary"), primary, setPrimary)}
        {renderInputs(t("matchmaking.partner", "Partner"), partner, setPartner)}
        <div style={{ marginTop: "1rem" }}>
          <label>{t("matchmaking.preferences", "Modern preference tags (comma separated)")}</label>
          <input
            value={modernPreferences}
            onChange={(event) => setModernPreferences(event.target.value)}
            placeholder="remote-first, startup-ops, arts-collab"
          />
          <div className="alignment-preview" aria-live="polite">
            <p className="muted" style={{ marginBottom: "0.25rem" }}>
              {t(
                "matchmaking.alignments",
                "Animated tags show how your modern filters will align with manuscript energies.",
              )}
            </p>
            <div className="alignment-tags">
              {modernPreferences
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((tag, index) => (
                  <span className="tag-chip" key={tag} style={{ animationDelay: `${index * 60}ms` }}>
                    {tag}
                  </span>
                ))}
            </div>
          </div>
          <p className="muted" style={{ marginTop: "0.35rem" }}>
            {t("form.accessibility", "Tags are optional but help align manuscript guna scores with compatibility signals.")}
          </p>
        </div>
        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || !chartsReady}
            aria-label={t("pages.matchmaking.title", "Compute compatibility")}
          >
            {loading ? t("form.loading", "Evaluating guna...") : t("pages.matchmaking.title", "Compute compatibility")}
          </button>
          <span className="muted">
            {chartsReady
              ? t("form.accessibility", "Compatibility indices blend sutra guidance with modern priorities.")
              : t("matchmaking.chartsFirst", "Enter both timelines so charts can be generated side-by-side.")}
          </span>
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
