'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { requestCalendar } from "@/lib/api";
import { deriveHouseGrid, HouseSummary } from "@/lib/houseGrid";
import { useI18n } from "@/lib/i18n";
import { BirthDetails } from "@/types/astro";
import { useImmersiveFeedback } from "@/lib/immersive";
import { formatSakaLabel } from "@/lib/sakaContext";
import BackendHealthNotice from "@/components/BackendHealthNotice";
import { saveBirthDetails } from "@/lib/birthStorage";
import { DEFAULT_BIRTH_DETAILS } from "@/lib/birthDefaults";

type BirthForm = BirthDetails;

type ValidationState = {
  dob?: string;
  tob?: string;
  pob?: string;
};

type GoogleLatLng = { lat: () => number; lng: () => number };
type GoogleMapInstance = {
  addListener: (eventName: string, handler: (event: { latLng: GoogleLatLng }) => void) => void;
  setCenter: (coords: { lat: number; lng: number }) => void;
};
type GoogleMarkerInstance = {
  setPosition: (coords: { lat: number; lng: number }) => void;
};
type MapHandle = {
  map: GoogleMapInstance | null;
  marker: GoogleMarkerInstance | null;
};

type GoogleMapsAutocomplete = {
  addListener: (eventName: string, handler: () => void) => void;
  getPlace: () => {
    formatted_address?: string;
    name?: string;
    geometry?: { location?: GoogleLatLng };
  };
};

type GoogleMapsApi = {
  Map: new (
    canvas: HTMLDivElement,
    options: { center: { lat: number; lng: number }; zoom: number; disableDefaultUI: boolean },
  ) => GoogleMapInstance;
  Marker: new (options: { position: { lat: number; lng: number }; map: GoogleMapInstance }) => GoogleMarkerInstance;
  places?: {
    Autocomplete: new (
      input: HTMLInputElement,
      options?: { fields?: Array<"formatted_address" | "geometry" | "name">; types?: string[] },
    ) => GoogleMapsAutocomplete;
  };
};

declare global {
  interface Window {
    google?: { maps?: GoogleMapsApi };
  }
}

const INITIAL_DETAILS: BirthForm = {
  ...DEFAULT_BIRTH_DETAILS,
  lunarTithi: "",
  moonElement: "",
  birthDate: "",
  birthTime: "",
  birthPlace: "",
  timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
};

export default function BirthInputForm() {
  const { t } = useI18n();
  const [details, setDetails] = useState<BirthForm>(INITIAL_DETAILS);
  const [houseGrid, setHouseGrid] = useState<HouseSummary[]>([]);
  const [sakaLabel, setSakaLabel] = useState<string>("Awaiting Bharat conversion");
  const [sakaParts, setSakaParts] = useState<{ year?: number; month?: string; day?: number }>({});
  const [bharatPreview, setBharatPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validations, setValidations] = useState<ValidationState>({});
  const [locationStatus, setLocationStatus] = useState("Waiting for map suggestions…");
  const [assistiveMode, setAssistiveMode] = useState(false);
  const [voiceGuidance, setVoiceGuidance] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [mapPreview, setMapPreview] = useState<string | null>(null);
  const [resolvedPlace, setResolvedPlace] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);
  const mapHandleRef = useRef<MapHandle>({ map: null, marker: null });
  const [gestureMode, setGestureMode] = useState(false);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const { triggerSubmitFeedback } = useImmersiveFeedback();
  const placeInputRef = useRef<HTMLInputElement | null>(null);
  const mapCanvasRef = useRef<HTMLDivElement | null>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);

  const isComplete = useMemo(
    () => Boolean(details.birthDate && details.birthTime && details.birthPlace),
    [details.birthDate, details.birthPlace, details.birthTime],
  );
  const hasValidationIssues = useMemo(() => Boolean(Object.keys(validations).length), [validations]);
  const confidenceLabel =
    confidenceScore >= 90
      ? "Chart confidence: High"
      : confidenceScore >= 60
        ? "Chart confidence: Medium — tighten location or time"
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

  useEffect(() => {
    const conversionBoost = sakaParts.year ? 5 : 0;
    const mapBoost = mapPreview ? 5 : 0;
    setConfidenceScore(Math.min(100, completionScore + conversionBoost + mapBoost));
  }, [completionScore, mapPreview, sakaParts.day, sakaParts.month, sakaParts.year]);

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
    hints.push(`Confidence score now ${confidenceScore}% — higher scores unlock richer charts.`);
    return hints;
  }, [completionScore, confidenceScore, missingFields, validations.dob, validations.pob, validations.tob]);

  const updateMapFromCoords = useCallback(
    (lat: number, lng: number) => {
      setMapPreview(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
      const googleApi = (window as typeof window & { google?: { maps?: GoogleMapsApi } }).google;
      if (!googleApi?.maps || !mapCanvasRef.current) return;
      if (!mapHandleRef.current.map) {
        const map = new googleApi.maps.Map(mapCanvasRef.current, {
          center: { lat, lng },
          zoom: 5,
          disableDefaultUI: true,
        });
        const marker = new googleApi.maps.Marker({ position: { lat, lng }, map });
        mapHandleRef.current = { map, marker };
        map.addListener("click", (event: { latLng: GoogleLatLng }) => {
          const nextLat = event.latLng.lat();
          const nextLng = event.latLng.lng();
          setDetails((prev) => ({ ...prev, birthPlace: `${nextLat.toFixed(3)}, ${nextLng.toFixed(3)}` }));
          updateMapFromCoords(nextLat, nextLng);
          void resolvePlaceFromCoords(nextLat, nextLng);
        });
      } else if (mapHandleRef.current.map) {
        mapHandleRef.current.map.setCenter({ lat, lng });
        if (mapHandleRef.current.marker) {
          mapHandleRef.current.marker.setPosition({ lat, lng });
        }
      }
    },
    [setDetails],
  );

  const validate = (payload: BirthForm): ValidationState => {
    const feedback: ValidationState = {};

    if (payload.birthDate) {
      const year = Number(payload.birthDate.split("-")[0]);
      if (year < 1900 || year > 2100 || !/^\d{4}-\d{2}-\d{2}$/.test(payload.birthDate)) {
        feedback.dob = t("form.error.birthDate", "Use YYYY-MM-DD between 1900-2100.");
      }
    }

    if (payload.birthTime && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(payload.birthTime)) {
      feedback.tob = t("form.error.birthTime", "Use HH:MM in 24h format (e.g., 07:45)");
    }

    if (payload.birthPlace) {
      if (payload.birthPlace.length < 3 || !payload.birthPlace.includes(",")) {
        feedback.pob = t("form.error.birthPlace", "Add city and country (e.g., Jaipur, Bharat)");
      }
    }

    if (payload.lunarTithi && (!/^\d+$/.test(payload.lunarTithi) || Number(payload.lunarTithi) < 1 || Number(payload.lunarTithi) > 30)) {
      feedback.dob = t("form.error.lunarTithi", "Lunar tithi must be 1-30.");
    }

    if (payload.moonElement && !["water", "fire", "air", "earth", "ether"].includes(payload.moonElement.toLowerCase())) {
      feedback.dob = t("form.error.moonElement", "Use water, fire, air, earth, or ether for moon element.");
    }

    return feedback;
  };

  type SakaDatePayload = {
    year?: number;
    month?: string;
    day?: number;
    month_index?: number;
    leap_year?: boolean;
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
      const sakaDatePayload: SakaDatePayload | undefined =
        typeof response === "object" && response && "saka_date" in response
          ? (response as { saka_date?: SakaDatePayload }).saka_date
          : undefined;
      const sakaValue = sakaDatePayload
        ? {
            year: sakaDatePayload.year,
            month: sakaDatePayload.month,
            day: sakaDatePayload.day,
            monthIndex: sakaDatePayload.month_index,
            leapYear: sakaDatePayload.leap_year,
          }
        : {};
      setSakaLabel(formatSakaLabel(sakaValue));
      setSakaParts((prev) => ({ ...prev, ...sakaValue }));
      setHouseGrid(deriveHouseGrid(details, sakaValue.month, sakaValue.day));
      saveBirthDetails(
        {
          ...details,
          birthDate: details.birthDate,
          birthTime: details.birthTime,
          birthPlace: details.birthPlace,
          timezone: details.timezone,
          sakaMonth: sakaValue.month,
          sakaDay: sakaValue.day,
        },
        { autoSubmit: true },
      );
      setInfoBanner(
        t(
          "form.nextStep",
          "Birth details saved. Your horoscope form below is now filled—submit to generate charts.",
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to compute Bharat calendar";
      setError(`${message}. Friendly tip: double-check timezone or pick a nearby city; we auto-suggest once the pin locks.`);
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
      setBharatPreview("");
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
      const formattedLabel = formatSakaLabel(parsed);
      setSakaLabel(formattedLabel);
      const timeLabel = details.birthTime ? `at ${details.birthTime}` : "";
      const tzLabel = details.timezone ? `(${details.timezone})` : "device timezone";
      const placeLabel = resolvedPlace || details.birthPlace || "place pending";
      setBharatPreview(
        parsed.year
          ? `Bharat calendar: ${formattedLabel} ${timeLabel} ${tzLabel} • ${placeLabel}`.trim()
          : "Śaka conversion ready after choosing date, time, and place.",
      );
    } catch (err) {
      console.error(err);
      setSakaLabel("Śaka conversion ready");
      setSakaParts({});
      setBharatPreview("");
    }
  }, [details.birthDate, details.birthPlace, details.birthTime, details.timezone, resolvedPlace]);

  const resolvePlaceFromCoords = useCallback(
    async (lat: number, lng: number) => {
      setLocationStatus("Calling Bharat geolocation service…");
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        );
        const payload = (await response.json()) as { display_name?: string };
        if (payload.display_name) {
          setResolvedPlace(payload.display_name);
          setDetails((prev) => ({ ...prev, birthPlace: payload.display_name ?? prev.birthPlace }));
          setLocationStatus("Map pin synced with Bharat geolocation.");
          speak("Map pin synced with Bharat geolocation.");
        } else {
          setResolvedPlace(null);
          setLocationStatus("Coordinates captured; unable to resolve address.");
        }
      } catch (err) {
        console.error(err);
        setResolvedPlace(null);
        setLocationStatus("Geolocation lookup unavailable; using coordinates.");
      }
    },
    [],
  );

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
      const googleApi = (window as typeof window & { google?: { maps?: GoogleMapsApi } }).google;
      if (!placeInputRef.current || !googleApi?.maps?.places?.Autocomplete) return;
      const autocomplete = new googleApi.maps.places.Autocomplete(placeInputRef.current, {
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
          updateMapFromCoords(lat, lng);
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

      if (mapCanvasRef.current && !mapHandleRef.current.map) {
        const starterLat = 20.5937;
        const starterLng = 78.9629;
        updateMapFromCoords(starterLat, starterLng);
      }
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
  }, [updateMapFromCoords]);

  useEffect(() => {
    const root = document.documentElement;
    const activeScale = assistiveMode ? Math.max(fontScale, 1.08) : fontScale;
    root.style.setProperty("--font-scale", activeScale.toString());
    return () => root.style.setProperty("--font-scale", "1");
  }, [assistiveMode, fontScale]);

  useEffect(() => {
    document.body.dataset.gestures = gestureMode ? "on" : "off";
  }, [gestureMode]);

  const speak = (text: string) => {
    if (!voiceGuidance) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
  };

  const liveGrid = useMemo(
    () => (houseGrid.length ? houseGrid : deriveHouseGrid(details)),
    [details, houseGrid],
  );

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
        <BackendHealthNotice />
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
          <button
            type="button"
            className={`assistive-chip ${gestureMode ? "assistive-chip--active" : ""}`}
            onClick={() => setGestureMode((prev) => !prev)}
          >
            {gestureMode ? "Gesture prompts on" : "Enable gesture prompts"}
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
              <div className="confidence-meter__bar" style={{ width: `${confidenceScore}%` }} />
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
        {infoBanner ? (
          <div className="inline-banner inline-banner--success" role="status">
            <strong>{t("form.saved", "Ready for horoscope")}</strong>
            <p className="microcopy">{infoBanner}</p>
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

        <div className="map-picker" role="region" aria-label="Map-based place selection">
          <div className="map-picker__header">
            <div>
              <p className="eyebrow">Interactive map</p>
              <h4>Pin the birthplace</h4>
              <p className="microcopy">
                Tap the map to drop a pin or use the autocomplete box. Coordinates feed the Śaka conversion and timezone lookup
                with confidence scores.
              </p>
              <p className="microcopy" aria-live="polite">{locationStatus}</p>
            </div>
            <div className="map-picker__actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  if (!navigator.geolocation) {
                    setLocationStatus("Geolocation unavailable on this device.");
                    return;
                  }
                  setLocationStatus("Fetching device location…");
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      setDetails((prev) => ({ ...prev, birthPlace: `${latitude.toFixed(3)}, ${longitude.toFixed(3)}` }));
                      updateMapFromCoords(latitude, longitude);
                      void resolvePlaceFromCoords(latitude, longitude);
                    },
                    () => setLocationStatus("Unable to read device location; try typing the city."),
                  );
                }}
              >
                Use current location
              </button>
              <button type="button" className="ghost-button" onClick={() => placeInputRef.current?.focus()}>
                Focus search box
              </button>
            </div>
          </div>
          <div className="map-picker__canvas" ref={mapCanvasRef} role="presentation" aria-hidden={!mapPreview}>
            {!mapPreview ? <p className="microcopy">Map will display after picking a city or tapping the button.</p> : null}
          </div>
          <div className="map-picker__footer" aria-live="polite">
            <p className="microcopy">{mapPreview ? `Pinned at ${mapPreview}` : "Waiting for a pin"}</p>
            {resolvedPlace ? <p className="microcopy">Resolved to: {resolvedPlace}</p> : null}
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

        <div className="saka-highlight" role="status" aria-live="polite">
          <div>
            <p className="eyebrow">Śaka calendar preview</p>
            <h4>{sakaLabel}</h4>
            <p className="microcopy">
              {details.birthDate
                ? bharatPreview ||
                  `Derived from ${details.birthDate} with auto timezone ${details.timezone || "device default"}.`
                : "Add a date and location to view Śaka year, month, and day."}
            </p>
          </div>
          <div className="confidence-meter" role="img" aria-label={`Confidence ${confidenceScore}%`}>
            <div className="confidence-meter__track">
              <div className="confidence-meter__bar" style={{ width: `${confidenceScore}%` }} />
            </div>
            <p className="microcopy">Confidence recalculates as you adjust map, date, and time.</p>
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
