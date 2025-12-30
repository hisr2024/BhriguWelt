'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { requestMatchmaking, upsertProfile } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { captureClientError } from "@/lib/telemetry";
import { BirthDetails } from "@/types/astro";
import { useImmersiveFeedback } from "@/lib/immersive";
import PredictionCard from "./PredictionCard";
import BackendHealthNotice from "@/components/BackendHealthNotice";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";
import { loadBirthDetails, onBirthDetails } from "@/lib/birthStorage";
import { deriveHousePlacements, formatHouseNarrative, useSakaContext } from "@/lib/sakaContext";
import { getProfileIdentifiers, persistProfileIdentifiers } from "@/lib/profileStorage";
import { MatchmakingPair, saveMatchmakingPair } from "@/lib/matchmakingStorage";

type MatchmakingPayload = {
  primary_name?: string;
  partner_name?: string;
  interpretation?: string;
  interpretation_hi?: string;
  sections?: Record<string, string>;
  compatibility?: {
    compatibility_index?: number;
    long_term_index?: number;
    short_term_index?: number;
    breakdown?: { description?: string; notes?: string }[];
    modern_highlights?: string[];
    alignment_percentages?: { emotional?: number; spiritual?: number; communication?: number };
  };
  modern_preferences?: string[];
  charts?: {
    shared_score?: number;
    synastry_overlay?: { label?: string; theme?: string; alignment?: number; tags?: string[] }[];
  };
};

type MatchmakingCard = {
  id: string;
  kicker?: string;
  title: string;
  subtitle?: string;
  metric?: string;
  body?: string;
  details?: string[];
  tags?: string[];
};

export default function MatchmakingForm() {
  const { t } = useI18n();
  const [primary, setPrimary] = useState<BirthDetails>({ ...DEFAULT_BIRTH_DETAILS });
  const [partner, setPartner] = useState<BirthDetails>({ ...DEFAULT_BIRTH_DETAILS });
  const [modernPreferences, setModernPreferences] = useState("remote-first, research-partnership");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [chartsReady, setChartsReady] = useState(false);
  const [prefillInfo, setPrefillInfo] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [savePair, setSavePair] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const { triggerSubmitFeedback } = useImmersiveFeedback();
  const { sakaState } = useSakaContext();

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

  const parsedPreferences = useMemo(
    () =>
      modernPreferences
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [modernPreferences],
  );

  const formatIndex = (value?: number) => {
    if (value === undefined) return null;
    const normalized = value <= 1 ? value * 100 : value;
    return `${Math.round(normalized)} / 100`;
  };

  const formatPercent = (value?: number) => {
    if (value === undefined) return null;
    const normalized = value <= 1 ? value * 100 : value;
    return `${Math.round(normalized)}%`;
  };

  const buildSavedPair = (result?: MatchmakingPayload): MatchmakingPair => ({
    id: `pair-${Date.now()}`,
    primaryName: primary.name,
    partnerName: partner.name,
    createdAt: new Date().toISOString(),
    compatibilityIndex: result?.compatibility?.compatibility_index,
    longTermIndex: result?.compatibility?.long_term_index,
    shortTermIndex: result?.compatibility?.short_term_index,
    alignment: result?.compatibility?.alignment_percentages,
    modernPreferences: parsedPreferences,
  });

  const savePairToProfile = async (result?: MatchmakingPayload) => {
    const identifiers = getProfileIdentifiers();
    const pair = buildSavedPair(result);
    const updatedPairs = saveMatchmakingPair(pair);
    const pairsPayload = updatedPairs.length ? updatedPairs : [pair];
    try {
      const response = await upsertProfile(
        {
          user_id: identifiers.userId,
          full_name: primary.name,
          date_of_birth: primary.birthDate,
          time_of_birth: primary.birthTime,
          place_of_birth: primary.birthPlace,
          metadata: {
            latest_matchmaking_pair: pair,
            matchmaking_pairs: pairsPayload,
          },
        },
        identifiers.sessionKey,
      );
      persistProfileIdentifiers({
        profileId: response.id,
        userId: response.user_id,
        sessionKey: identifiers.sessionKey,
      });
      setSaveStatus("Pair saved to profile / प्रोफ़ाइल में सहेजा गया।");
    } catch (profileError) {
      console.warn("Matchmaking profile sync failed", profileError);
      setSaveStatus("Saved locally; profile sync pending / स्थानीय रूप से सहेजा गया।");
    }
  };

  const matchPayload = useMemo(
    () => (payload && typeof payload === "object" ? (payload as MatchmakingPayload) : undefined),
    [payload],
  );

  const compatibilityIndex = formatIndex(matchPayload?.compatibility?.compatibility_index);
  const longTermIndex = formatIndex(matchPayload?.compatibility?.long_term_index);
  const shortTermIndex = formatIndex(matchPayload?.compatibility?.short_term_index);

  const resultCards = useMemo(() => {
    if (!matchPayload) return [];
    const cards: MatchmakingCard[] = [];
    if (compatibilityIndex) {
      cards.push({
        id: "harmony",
        kicker: "Compatibility / संगति",
        title: "Harmony index",
        subtitle: "Overall cosmic resonance / समग्र ऊर्जा",
        metric: compatibilityIndex,
        body: "Layered guna, lifestyle, and chart resonances are blended into a single harmony view.",
      });
    }
    if (longTermIndex || shortTermIndex) {
      cards.push({
        id: "trajectory",
        kicker: "Trajectory / दिशा",
        title: "Relationship horizons",
        subtitle: "Short-term + long-term blend / अल्प-दीर्घ परिणाम",
        metric: longTermIndex || shortTermIndex,
        details: [
          longTermIndex ? `Long-term: ${longTermIndex}` : null,
          shortTermIndex ? `Short-term: ${shortTermIndex}` : null,
        ].filter(Boolean) as string[],
      });
    }
    if (matchPayload.compatibility?.alignment_percentages) {
      const align = matchPayload.compatibility.alignment_percentages;
      cards.push({
        id: "alignments",
        kicker: "Alignment / सामंजस्य",
        title: "Emotional + spiritual + communication",
        subtitle: "Layered alignment blend / त्रि-आयामी संतुलन",
        details: [
          align.emotional !== undefined ? `Emotional: ${formatPercent(align.emotional)}` : null,
          align.spiritual !== undefined ? `Spiritual: ${formatPercent(align.spiritual)}` : null,
          align.communication !== undefined ? `Communication: ${formatPercent(align.communication)}` : null,
        ].filter(Boolean) as string[],
      });
    }
    if (matchPayload.compatibility?.breakdown?.length) {
      cards.push({
        id: "breakdown",
        kicker: "Highlights / मुख्य बिंदु",
        title: "Compatibility breakdown",
        subtitle: "Key friction + harmony nodes / प्रमुख संकेत",
        details: matchPayload.compatibility.breakdown
          .map((item) => `${item.description ?? ""}${item.notes ? ` — ${item.notes}` : ""}`)
          .filter(Boolean),
      });
    }
    if (matchPayload.compatibility?.modern_highlights?.length || matchPayload.modern_preferences?.length) {
      cards.push({
        id: "modern",
        kicker: "Modern filters / आधुनिक",
        title: "Lifestyle resonance",
        subtitle: "Preferences + shared rhythm / आधुनिक मेल",
        details: matchPayload.compatibility?.modern_highlights ?? [],
        tags: matchPayload.modern_preferences ?? [],
      });
    }
    if (matchPayload.sections) {
      const headings = [
        "Restatement of couple data & query",
        "Disclaimer & orientation",
        "Individual snapshots",
        "Ashta Koota summary",
        "Detailed compatibility",
        "Risk areas & balancing factors",
        "Guidance & remedies",
        "Closing & free will",
      ];
      Object.entries(matchPayload.sections)
        .sort(([a], [b]) => Number(a) - Number(b))
        .forEach(([id, text]) => {
          if (!text) return;
          cards.push({
            id: `section-${id}`,
            kicker: `Section ${id}`,
            title: headings[Number(id) - 1] || `Section ${id}`,
            subtitle: `${text.slice(0, 110).trim()}${text.length > 110 ? "…" : ""}`,
            body: text,
          });
        });
    } else if (matchPayload.interpretation) {
      cards.push({
        id: "narrative",
        kicker: "Narrative / कथा",
        title: "Interpretation",
        subtitle: matchPayload.interpretation.slice(0, 110),
        body: matchPayload.interpretation,
      });
    }
    return cards;
  }, [compatibilityIndex, longTermIndex, matchPayload, shortTermIndex]);

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

  useEffect(() => {
    if (!sakaState.houseGrid?.length && !sakaState.details) return;
    const placements = deriveHousePlacements(sakaState.houseGrid || [], sakaState.sakaDate?.day);
    setPrimary((prev) => ({
      ...prev,
      birthDate: sakaState.details?.birthDate || prev.birthDate,
      birthTime: sakaState.details?.birthTime || prev.birthTime,
      birthPlace: sakaState.details?.birthPlace || prev.birthPlace,
      lunarTithi: placements.lunarTithi || prev.lunarTithi,
      moonElement: placements.moonElement || prev.moonElement,
      marsHouse: placements.marsHouse || prev.marsHouse,
      saturnHouse: placements.saturnHouse || prev.saturnHouse,
      venusHouse: placements.venusHouse || prev.venusHouse,
      ketuHouse: placements.ketuHouse || prev.ketuHouse,
      mercuryHouse: placements.mercuryHouse || prev.mercuryHouse,
      jupiterHouse: placements.jupiterHouse || prev.jupiterHouse,
      rahuAspectsAscendant:
        placements.rahuAspectsAscendant !== undefined
          ? placements.rahuAspectsAscendant
          : prev.rahuAspectsAscendant,
    }));
    setPrefillInfo(formatHouseNarrative(sakaState.houseGrid, sakaState.sakaDate));
  }, [sakaState.details?.birthDate, sakaState.details?.birthPlace, sakaState.details?.birthTime, sakaState.houseGrid, sakaState.sakaDate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    triggerSubmitFeedback();
    setError(null);
    setPayload(null);
    setSaveStatus(null);
    setActiveCardId(null);
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
      if (savePair) {
        await savePairToProfile(response as MatchmakingPayload);
      }
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

  const primaryLabel = `${t("matchmaking.primary", "Primary chart")} / मुख्य कुंडली`;
  const partnerLabel = `${t("matchmaking.partner", "Partner chart")} / साथी कुंडली`;

  return (
    <section aria-labelledby="matchmaking-heading">
      <form onSubmit={handleSubmit} aria-busy={loading} aria-describedby="matchmaking-helper">
        <header className="section-heading">
          <p className="eyebrow">Compatibility lab / संगति प्रयोगशाला</p>
          <h2 id="matchmaking-heading">{t("pages.matchmaking.title", "Modern Bhrigu matchmaking flow")}</h2>
          <p className="muted" id="matchmaking-helper">
            {t(
              "form.helper",
              "Compare two complete birth records plus lifestyle tags to align manuscript and modern signals.",
            )}{" "}
            / दो संपूर्ण जन्म विवरण और आधुनिक प्राथमिकताएँ जोड़ें।
          </p>
          <BackendHealthNotice />
          {prefillInfo ? (
            <p className="microcopy" aria-live="polite">{prefillInfo}</p>
          ) : null}
          <p className="microcopy disclaimer">
            Disclaimer: Guidance is reflective, not deterministic. / अस्वीकरण: यह मार्गदर्शन चिंतन हेतु है, निश्चित भविष्यवाणी नहीं।
          </p>
        </header>
        <div className="duo-overlay" role="status" aria-live="polite">
          <div className={`duo-overlay__orb ${hasBirthDetails(primary) ? "duo-overlay__orb--ready" : ""}`}>
            <span className="duo-overlay__label">{primary.name || primaryLabel}</span>
            <span className="duo-overlay__energy">Solar flow / सौर प्रवाह</span>
          </div>
          <div className="duo-overlay__merge">
            <p className="microcopy">
              {chartsReady
                ? t(
                    "matchmaking.overlayReady",
                    "Dual charts locked. Compatibility overlays will blend guna and lifestyle energies.",
                  )
                : t("matchmaking.overlayLocked", "Enter both charts to unlock the layered aura preview.")}{" "}
              / दोनों कुंडली दर्ज करें।
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
            <span className="duo-overlay__label">{partner.name || partnerLabel}</span>
            <span className="duo-overlay__energy">Lunar flow / चंद्र प्रवाह</span>
          </div>
        </div>
        <div className={`matchmaking-energy ${chartsReady ? "matchmaking-energy--ready" : ""}`}>
          <div className="matchmaking-energy__header">
            <h3>Cosmic compatibility field / दैवी संगति क्षेत्र</h3>
            <p className="muted">Layered auras animate once both charts are ready. / दोनों कुंडली के बाद ऊर्जा सक्रिय होगी।</p>
          </div>
          <div className={`matchmaking-energy__field ${payload ? "matchmaking-energy__field--active" : ""}`}>
            <span className="matchmaking-energy__layer matchmaking-energy__layer--primary" aria-hidden />
            <span className="matchmaking-energy__layer matchmaking-energy__layer--partner" aria-hidden />
            <span className="matchmaking-energy__layer matchmaking-energy__layer--core" aria-hidden />
            <div className="matchmaking-energy__content">
              <div className="matchmaking-energy__labels">
                <span>{primaryLabel}</span>
                <span>{partnerLabel}</span>
              </div>
              <p className="microcopy">
                {chartsReady
                  ? "Charts verified. Tap results below for layered insights. / कुंडली सत्यापित हैं।"
                  : "Charts required before compatibility. / पहले दोनों कुंडली आवश्यक हैं।"}
              </p>
              {compatibilityIndex ? (
                <div className="matchmaking-energy__metrics">
                  <span>Harmony {compatibilityIndex}</span>
                  {matchPayload?.charts?.shared_score !== undefined ? (
                    <span>Shared score {formatPercent(matchPayload.charts.shared_score)}</span>
                  ) : null}
                </div>
              ) : null}
              {matchPayload?.charts?.synastry_overlay?.length ? (
                <div className="matchmaking-energy__overlays">
                  {matchPayload.charts.synastry_overlay.map((overlay, index) => (
                    <span key={`${overlay.label ?? "overlay"}-${index}`} className="matchmaking-energy__tag">
                      {overlay.label || "Overlay"} {overlay.alignment !== undefined ? `${Math.round(overlay.alignment)}%` : ""}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        {renderInputs(primaryLabel, primary, setPrimary)}
        {renderInputs(partnerLabel, partner, setPartner)}
        <div style={{ marginTop: "1rem" }}>
          <label>{t("matchmaking.preferences", "Modern preference tags (comma separated)")} / आधुनिक टैग</label>
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
              )}{" "}
              / टैग्स आपकी आधुनिक प्राथमिकताओं को दर्शाते हैं।
            </p>
            <div className="alignment-tags">
              {parsedPreferences.map((tag, index) => (
                  <span className="tag-chip" key={tag} style={{ animationDelay: `${index * 60}ms` }}>
                    {tag}
                  </span>
                ))}
            </div>
          </div>
          <p className="muted" style={{ marginTop: "0.35rem" }}>
            {t("form.accessibility", "Tags are optional but help align manuscript guna scores with compatibility signals.")}{" "}
            / टैग्स वैकल्पिक हैं।
          </p>
        </div>
        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || !chartsReady}
            aria-label={t("pages.matchmaking.title", "Compute compatibility")}
          >
            {loading ? t("form.loading", "Evaluating guna...") : "Compute compatibility / संगति देखें"}
          </button>
          <span className="muted">
            {chartsReady
              ? t("form.accessibility", "Compatibility indices blend sutra guidance with modern priorities.")
              : t("matchmaking.chartsFirst", "Enter both timelines so charts can be generated side-by-side.")}{" "}
            / दोनों चार्ट आवश्यक हैं।
          </span>
        </div>
        <div className="matchmaking-save">
          <label className="checkbox-inline">
            <input
              type="checkbox"
              checked={savePair}
              onChange={(event) => setSavePair(event.target.checked)}
            />
            <span>Save this pair in profile / प्रोफ़ाइल में जोड़ी सहेजें</span>
          </label>
          <p className="microcopy">Saved pairs stay private to your profile session. / जोड़ी निजी रहेगी।</p>
          {saveStatus ? <p className="microcopy" aria-live="polite">{saveStatus}</p> : null}
        </div>
        {error && (
          <div className="error-banner" role="alert" aria-live="assertive" tabIndex={-1} ref={errorRef}>
            {t("form.error", error)}
          </div>
        )}
      </form>
      {resultCards.length > 0 && (
        <section className="matchmaking-cards" aria-label="Matchmaking results">
          <div className="section-heading">
            <p className="eyebrow">Compatibility cards / कार्ड</p>
            <h3>Interactive insight cards / इंटरैक्टिव कार्ड</h3>
            <p className="muted">Tap a card to expand the reading. / कार्ड पर टैप करके पढ़ें।</p>
          </div>
          <div className="matchmaking-card-grid">
            {resultCards.map((card) => {
              const isOpen = activeCardId === card.id;
              return (
                <article key={card.id} className={`matchmaking-card ${isOpen ? "is-open" : ""}`}>
                  <button
                    type="button"
                    className="matchmaking-card__toggle"
                    onClick={() => setActiveCardId(isOpen ? null : card.id)}
                    aria-expanded={isOpen}
                    aria-controls={`matchmaking-card-${card.id}`}
                  >
                    <div>
                      {card.kicker ? <p className="eyebrow">{card.kicker}</p> : null}
                      <h4>{card.title}</h4>
                      {card.subtitle ? <p className="muted">{card.subtitle}</p> : null}
                    </div>
                    {card.metric ? <span className="matchmaking-card__metric">{card.metric}</span> : null}
                  </button>
                  <div id={`matchmaking-card-${card.id}`} className="matchmaking-card__body">
                    {card.body ? <p>{card.body}</p> : null}
                    {card.details?.length ? (
                      <ul>
                        {card.details.map((detail, index) => (
                          <li key={`${card.id}-detail-${index}`}>{detail}</li>
                        ))}
                      </ul>
                    ) : null}
                    {card.tags?.length ? (
                      <div className="matchmaking-card__tags">
                        {card.tags.map((tag) => (
                          <span key={`${card.id}-tag-${tag}`} className="tag-chip">
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          <p className="microcopy disclaimer">
            Compatibility insights are reflective guidance, not guarantees. / संगति संकेत मार्गदर्शन हैं, निश्चित परिणाम नहीं।
          </p>
        </section>
      )}
      <PredictionCard title="Matchmaking result" payload={payload} engine="matchmaking" />
    </section>
  );
}
