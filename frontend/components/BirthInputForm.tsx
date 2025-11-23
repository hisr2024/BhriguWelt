'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { requestCalendar } from "@/lib/api";
import { deriveHouseGrid, HouseSummary } from "@/lib/houseGrid";
import { useI18n } from "@/lib/i18n";
import { CalendarDetails } from "@/types/astro";
import { useImmersiveFeedback } from "@/lib/immersive";

type BirthForm = CalendarDetails & {
  lunarTithi: string;
  moonElement: string;
  timezone: string;
};

type ValidationState = {
  dob?: string;
  tob?: string;
  pob?: string;
};

type GoogleMapsAutocomplete = {
  addListener: (eventName: string, handler: () => void) => void;
  getPlace: () => {
    formatted_address?: string;
    name?: string;
    geometry?: { location?: { lat: () => number; lng: () => number } };
  };
};

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          Autocomplete: new (input: HTMLInputElement, options?: unknown) => GoogleMapsAutocomplete;
        };
      };
    };
  }
}

const INITIAL_DETAILS: BirthForm = {
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  lunarTithi: "",
  moonElement: "",
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
};

export default function BirthInputForm() {
  const { t } = useI18n();
  const [details, setDetails] = useState<BirthForm>(INITIAL_DETAILS);
  const [houseGrid, setHouseGrid] = useState<HouseSummary[]>([]);
  const [sakaLabel, setSakaLabel] = useState<string>("Awaiting Bharat conversion");
  const [sakaParts, setSakaParts] = useState<{ year?: number; month?: string; day?: number }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validations, setValidations] = useState<ValidationState>({});
  const [locationStatus, setLocationStatus] = useState("Waiting for map suggestions…");
  const [assistiveMode, setAssistiveMode] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [mapPreview, setMapPreview] = useState<string | null>(null);
  const { triggerSubmitFeedback } = useImmersiveFeedback();
  const placeInputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);

  const isComplete = useMemo(() => details.birthDate && details.birthTime && details.birthPlace, [details]);
  const hasValidationIssues = useMemo(() => Boolean(Object.keys(validations).length), [validations]);
  const confidenceLabel =
    isComplete && !hasValidationIssues
      ? "Chart confidence: High"
      : "Chart confidence: Provide all birth details for higher accuracy";
  const missingFields = useMemo(
    () =>
      ([
        ["dob", details.birthDate, "date of birth"],
        ["tob", details.birthTime, "time of birth"],
        ["pob", details.birthPlace, "place of birth"],
      ] as const)
        .filter(([, value]) => !value)
        .map(([, , label]) => label),
    [details.birthDate, details.birthPlace, details.birthTime],
  );

  const completionScore = useMemo(() => {
    let score = 0;
    if (details.birthDate) score += 30;
    if (details.birthTime) score += 30;
    if (details.birthPlace) score += 30;
    if (!hasValidationIssues) score += 10;
    return Math.min(100, score);
  }, [details.birthDate, details.birthPlace, details.birthTime, hasValidationIssues]);

  const placeSuggestion = useMemo(() => {
    if (!details.birthPlace) return null;
    if (!details.birthPlace.includes(",")) return "Add a city and country (e.g., Jaipur, Bharat) for map confidence.";
    return null;
  }, [details.birthPlace]);

  const smartSuggestions = useMemo(() => {
    const hints: string[] = [];
    if (validations.dob) hints.push(validations.dob);
    if (validations.tob) hints.push(validations.tob);
    if (validations.pob) hints.push(validations.pob);
    if (!hints.length && missingFields.length) {
      hints.push(`Add ${missingFields.join(", ")} for higher precision.`);
    }
    if (!hints.length && completionScore < 100) {
      hints.push("Double-check timezone or map pick to push confidence to 100%.");
    }
    return hints;
  }, [completionScore, missingFields, validations.dob, validations.pob, validations.tob]);

  const validate = (payload: BirthForm): ValidationState => {
    const feedback: ValidationState = {};

    if (payload.birthDate) {
      const year = Number(payload.birthDate.split("-")[0]);
      if (year < 1900 || year > 2100) {
        feedback.dob = "Try a date within 1900-2100";
      }
    }

    if (payload.birthTime && !/^\d{2}:\d{2}$/.test(payload.birthTime)) {
      feedback.tob = "Use HH:MM in 24h format (e.g., 07:45)";
    }

    if (payload.birthPlace && payload.birthPlace.length < 3) {
      feedback.pob = "Add at least 3 characters (city, country)";
    }

    return feedback;
  };

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError(null);
    const feedback = validate(details);
    setValidations(feedback);
    if (Object.keys(feedback).length) return;

    triggerSubmitFeedback();

    setLoading(true);
    try {
      const response = await requestCalendar(details);
      const sakaDate = typeof response === "object" && response && "saka_date" in response ? response.saka_date : undefined;
      const sakaValue = (sakaDate as { year?: number; month?: string; day?: number } | undefined) || {};
      setSakaLabel(
        sakaValue.year
          ? `Śaka ${sakaValue.year} ${sakaValue.month ?? ""} ${sakaValue.day ?? ""}`.trim()
          : "Śaka conversion ready",
      );
      setSakaParts((prev) => ({ ...prev, ...sakaValue }));
      setHouseGrid(deriveHouseGrid(details, sakaValue.month, sakaValue.day));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to compute Bharat calendar";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const feedback = validate(details);
    setValidations(feedback);
    if (!isComplete || Object.keys(feedback).length) return;

    const id = setTimeout(() => {
      void handleSubmit();
    }, 450);

    return () => clearTimeout(id);
  }, [details, isComplete]);

  useEffect(() => {
    if (!details.birthDate) {
      setSakaLabel("Awaiting Bharat conversion");
      setSakaParts({});
      return;
    }

    try {
      const formatter = new Intl.DateTimeFormat("en-IN-u-ca-indian", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const parts = formatter.formatToParts(new Date(details.birthDate));
      const sakaDraft = parts.reduce<Record<string, string>>((acc, part) => {
        if (part.type === "year" || part.type === "month" || part.type === "day") {
          acc[part.type] = part.value;
        }
        return acc;
      }, {});
      const parsed = {
        year: sakaDraft.year ? Number(sakaDraft.year) : undefined,
        month: sakaDraft.month,
        day: sakaDraft.day ? Number(sakaDraft.day) : undefined,
      };
      setSakaParts(parsed);
      setSakaLabel(
        parsed.year ? `Śaka ${parsed.year} ${parsed.month ?? ""} ${parsed.day ?? ""}`.trim() : "Śaka conversion ready",
      );
    } catch (err) {
      console.error(err);
      setSakaLabel("Śaka conversion ready");
      setSakaParts({});
    }
  }, [details.birthDate]);

  useEffect(() => {
    if (smartSuggestions.length) {
      speak(smartSuggestions[0]);
    }
  }, [smartSuggestions]);

  useEffect(() => {
    speak(locationStatus);
  }, [locationStatus]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !placeInputRef.current || autocompleteRef.current) return;

    const initAutocomplete = () => {
      if (!placeInputRef.current || !window.google?.maps?.places?.Autocomplete) return;
      const autocomplete = new window.google.maps.places.Autocomplete(placeInputRef.current, {
        fields: ["formatted_address", "geometry", "name"],
        types: ["(cities)"],
      });
      autocompleteRef.current = autocomplete;
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        const label = place.formatted_address || place.name;
        if (label) {
          setDetails((prev) => ({ ...prev, birthPlace: label }));
        }

        const coords = place.geometry?.location;
        if (coords) {
          const lat = coords.lat();
          const lng = coords.lng();
          setMapPreview(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
          const timestamp = Math.floor(Date.now() / 1000);
          setLocationStatus("Detecting timezone from map position…");
          fetch(
            `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`,
          )
            .then((response) => response.json())
            .then((payload: { timeZoneId?: string; status?: string }) => {
              if (payload.timeZoneId) {
                setDetails((prev) => ({ ...prev, timezone: payload.timeZoneId ?? prev.timezone }));
                setLocationStatus(`Timezone auto-set to ${payload.timeZoneId}`);
                speak(`Timezone auto-set to ${payload.timeZoneId}`);
              } else {
                setLocationStatus("Map lookup active; timezone unchanged");
              }
            })
            .catch(() => setLocationStatus("Map suggestions ready; timezone fallback in use."));
        }
      });
      setLocationStatus("Map suggestions ready. Pick a result to auto-fill.");
      speak("Map suggestions ready. Pick a result to auto-fill.");
    };

    if (window.google?.maps?.places) {
      initAutocomplete();
      return;
    }

    const scriptId = "google-places-script";
    if (document.getElementById(scriptId)) return;
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.onload = initAutocomplete;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const activeScale = assistiveMode ? Math.max(fontScale, 1.08) : fontScale;
    root.style.setProperty("--font-scale", activeScale.toString());
    return () => root.style.setProperty("--font-scale", "1");
  }, [assistiveMode, fontScale]);

  const speak = (text: string) => {
    if (!voiceGuidance) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
  };

  const liveGrid = houseGrid.length ? houseGrid : deriveHouseGrid(details);

  return (
    <section className="birth-input" id="birth-details" aria-label="Birth details and Bharat conversion">
      <header className="section-heading">
        <p className="eyebrow">{t("form.birth", "Birth input")}</p>
        <h2>Live Bharat alignment</h2>
        <p className="muted">
          Enter date, time, and place and watch the Śaka calendar alignment, house energy meter, and timezone auto-detection
          respond in real time. Start with essentials; unfold Panchanga extras when you are ready.
        </p>
        <p className="microcopy" aria-live="polite">{confidenceLabel}</p>
        <div className="assistive-row" role="group" aria-label="Accessibility controls">
          <button
            type="button"
            className={`assistive-chip ${assistiveMode ? "assistive-chip--active" : ""}`}
            onClick={() => setAssistiveMode((prev) => !prev)}
          >
            {assistiveMode ? "Comfort font + voice prompts on" : "Enable comfort font & guided hints"}
          </button>
          <button
            type="button"
            className={`assistive-chip ${voiceGuidance ? "assistive-chip--active" : ""}`}
            onClick={() => setVoiceGuidance((prev) => !prev)}
          >
            {voiceGuidance ? "Voice guidance active" : "Play voice guidance"}
          </button>
          <label className="assistive-slider" htmlFor="font-scale-slider">
            Font size
            <input
              id="font-scale-slider"
              type="range"
              min={0.94}
              max={1.2}
              step={0.02}
              value={fontScale}
              onChange={(event) => setFontScale(Number(event.target.value))}
            />
          </label>
          <div className="confidence-meter" role="img" aria-label={`Confidence ${completionScore}%`}>
            <div className="confidence-meter__track">
              <div className="confidence-meter__bar" style={{ width: `${completionScore}%` }} />
            </div>
            <p className="microcopy">Auto-Śaka conversion and map checks raise accuracy.</p>
          </div>
        </div>
      </header>

      <form className="birth-input__form" onSubmit={handleSubmit} aria-busy={loading}>
        {missingFields.length ? (
          <div className="inline-banner inline-banner--error" role="alert">
            <strong>Missing essentials.</strong>
            <p className="microcopy">Add {missingFields.join(", ")} to boost accuracy.</p>
          </div>
        ) : null}
        {smartSuggestions.length ? (
          <div className="inline-banner inline-banner--info" role="status">
            <strong>Smart suggestions</strong>
            <ul className="suggestion-list">
              {smartSuggestions.map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="field-row">
          <div className="field">
            <label htmlFor="birth-dob">Date of birth</label>
            <input
              id="birth-dob"
              type="date"
              value={details.birthDate}
              onChange={(event) => setDetails({ ...details, birthDate: event.target.value })}
              aria-invalid={Boolean(validations.dob)}
              aria-describedby={validations.dob ? "birth-dob-hint" : undefined}
              required
            />
            <p className="microcopy" id="birth-dob-hint" role="status">
              {validations.dob || "Try a date within 1900-2100 for best alignment."}
            </p>
          </div>
          <div className="field">
            <label htmlFor="birth-tob">Time of birth</label>
            <input
              id="birth-tob"
              type="time"
              value={details.birthTime}
              onChange={(event) => setDetails({ ...details, birthTime: event.target.value })}
              aria-invalid={Boolean(validations.tob)}
              aria-describedby={validations.tob ? "birth-tob-hint" : "birth-time-hint"}
              required
            />
            <p className="microcopy" id={validations.tob ? "birth-tob-hint" : "birth-time-hint"} role="status">
              {validations.tob || "Use HH:MM (e.g., 07:45); timezone auto-detected as " + (details.timezone || "—")}
            </p>
          </div>
        </div>

        <div className="field-row field-row--split">
          <div className="field">
            <label htmlFor="birth-pob">Place of birth</label>
            <input
              id="birth-pob"
              type="text"
              placeholder="Jaipur, Bharat"
              value={details.birthPlace}
              ref={placeInputRef}
              onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })}
              aria-invalid={Boolean(validations.pob)}
              aria-describedby={validations.pob ? "birth-pob-hint" : "birth-place-hint"}
              required
            />
            <p className="microcopy" id={validations.pob ? "birth-pob-hint" : "birth-place-hint"} role="status">
              {validations.pob || locationStatus || "Try adding city and country (e.g., Jaipur, Bharat)."}
            </p>
            {placeSuggestion ? <p className="microcopy">{placeSuggestion}</p> : null}
            {mapPreview ? (
              <p className="microcopy" aria-live="polite">
                Map anchor: {mapPreview} (double tap to refine on mobile gestures)
              </p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor="birth-timezone">Timezone</label>
            <input id="birth-timezone" type="text" value={details.timezone} readOnly aria-readonly />
            <p className="microcopy">Detected from device; adjust later in settings if needed.</p>
          </div>
        </div>

        <details className="cosmic-disclosure" open={showAdvanced}>
          <summary onClick={() => setShowAdvanced((prev) => !prev)}>Advanced Panchanga inputs</summary>
          <div className="field-row field-row--split">
            <div className="field">
              <label htmlFor="birth-tithi">Lunar tithi</label>
              <input
                id="birth-tithi"
                type="text"
                placeholder="e.g., Shukla 5"
                value={details.lunarTithi}
                onChange={(event) => setDetails({ ...details, lunarTithi: event.target.value })}
              />
              <p className="microcopy">Optional: surfaces in beginner and advanced interpretations.</p>
            </div>
            <div className="field">
              <label htmlFor="birth-moon-element">Moon element</label>
              <input
                id="birth-moon-element"
                type="text"
                placeholder="Water, Fire, Air, Earth"
                value={details.moonElement}
                onChange={(event) => setDetails({ ...details, moonElement: event.target.value })}
              />
              <p className="microcopy">Keep it simple—elementary guides adapt for beginners.</p>
            </div>
          </div>
        </details>

        <div className="action-row">
          <button type="submit" className="ghost-button" disabled={loading || !isComplete}>
            {loading ? "Computing Śaka details" : "Preview 12 houses"}
          </button>
          <div className="action-notes" aria-live="polite">
            <p className="microcopy">{sakaLabel}</p>
            {error ? <p className="microcopy error">{error}</p> : null}
          </div>
        </div>

        <div className="field-row field-row--split">
          <div className="field">
            <label htmlFor="saka-year">Śaka year</label>
            <input id="saka-year" type="text" value={sakaParts.year ?? ""} readOnly aria-readonly />
          </div>
          <div className="field">
            <label htmlFor="saka-month">Śaka month</label>
            <input id="saka-month" type="text" value={sakaParts.month ?? ""} readOnly aria-readonly />
          </div>
          <div className="field">
            <label htmlFor="saka-day">Śaka day</label>
            <input id="saka-day" type="text" value={sakaParts.day ?? ""} readOnly aria-readonly />
          </div>
        </div>
      </form>

      <div className="birth-preview" role="list" aria-live="polite">
        {liveGrid.map((house) => (
          <article key={house.index} className="birth-preview__card" role="listitem">
            <div className="birth-preview__orbit" aria-hidden>
              <span className="orbit-glow" />
              <span className="orbit-glow orbit-glow--accent" />
            </div>
            <div className="birth-preview__meta">
              <div className="birth-preview__label">
                <span className="badge">House {house.index}</span>
                <span className="house-sign">{house.sign}</span>
              </div>
              <p className="house-focus">{house.focus}</p>
              <p className="house-element">
                <span role="img" aria-label={house.element}>
                  {house.glyph}
                </span>{" "}
                {house.element}
              </p>
              <p className="microcopy" title={house.tooltip}>
                {house.tooltip}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
