'use client';

import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { requestCalendar } from "@/lib/api";
import { deriveHouseGrid, HouseSummary } from "@/lib/houseGrid";
import { useI18n } from "@/lib/i18n";
import { captureClientError } from "@/lib/telemetry";
import { CalendarDetails, CalendarPayload } from "@/types/astro";
import { useImmersiveFeedback } from "@/lib/immersive";
import PredictionCard from "./PredictionCard";
import BackendHealthNotice from "@/components/BackendHealthNotice";
import { loadBirthDetails, onBirthDetails, saveBirthDetails } from "@/lib/birthStorage";
import { deriveHousePlacements, formatSakaLabel, useSakaContext } from "@/lib/sakaContext";

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

const SAKA_MONTHS = [
  "Chaitra",
  "Vaisakha",
  "Jyestha",
  "Ashadha",
  "Shravana",
  "Bhadra",
  "Ashwin",
  "Kartika",
  "Agrahayana",
  "Pausha",
  "Magha",
  "Phalguna",
];

export default function CalendarForm() {
  const { t } = useI18n();
  const [details, setDetails] = useState<CalendarDetails>({
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
  const [timezone, setTimezone] = useState<string>(() =>
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "",
  );
  const [locationStatus, setLocationStatus] = useState("Waiting for map suggestions…");
  const [mapPreview, setMapPreview] = useState<string | null>(null);
  const [resolvedPlace, setResolvedPlace] = useState<string | null>(null);
  const mapHandleRef = useRef<MapHandle>({ map: null, marker: null });
  const placeInputRef = useRef<HTMLInputElement | null>(null);
  const mapCanvasRef = useRef<HTMLDivElement | null>(null);
  const autocompleteRef = useRef<GoogleMapsAutocomplete | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [houseGrid, setHouseGrid] = useState<HouseSummary[]>([]);
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef(0);
  const { triggerSubmitFeedback } = useImmersiveFeedback();
  const { updateSaka } = useSakaContext();
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const stored = loadBirthDetails();
    if (stored) {
      setDetails((prev) => ({
        birthDate: stored.birthDate ?? prev.birthDate,
        birthTime: stored.birthTime ?? prev.birthTime,
        birthPlace: stored.birthPlace ?? prev.birthPlace,
      }));
      if (stored.timezone) {
        setTimezone(stored.timezone);
      }
    }

    return onBirthDetails((next) => {
      setDetails((prev) => ({
        birthDate: next.birthDate ?? prev.birthDate,
        birthTime: next.birthTime ?? prev.birthTime,
        birthPlace: next.birthPlace ?? prev.birthPlace,
      }));
      if (next.timezone) {
        setTimezone(next.timezone);
      }
    });
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  useEffect(() => {
    setSyncNotice(null);
    setAutoTriggered(false);
  }, [details.birthDate, details.birthPlace, details.birthTime]);

  const hasRequiredDetails = useMemo(
    () => Boolean(details.birthDate && details.birthTime && details.birthPlace),
    [details.birthDate, details.birthPlace, details.birthTime],
  );

  const resolvePlaceFromCoords = useCallback(async (lat: number, lng: number) => {
    setLocationStatus("Calling geolocation service…");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      );
      const payload = (await response.json()) as { display_name?: string };
      if (payload.display_name) {
        setResolvedPlace(payload.display_name);
        setDetails((prev) => ({ ...prev, birthPlace: payload.display_name ?? prev.birthPlace }));
        setLocationStatus("Map pin synced with geolocation.");
      } else {
        setResolvedPlace(null);
        setLocationStatus("Coordinates captured; unable to resolve address.");
      }
    } catch (err) {
      console.error(err);
      setResolvedPlace(null);
      setLocationStatus("Geolocation lookup unavailable; using coordinates.");
    }
  }, []);

  const updateTimezoneFromCoords = useCallback(
    async (lat: number, lng: number) => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setLocationStatus("Timezone auto-detection needs a Maps API key.");
        return;
      }
      setLocationStatus("Detecting timezone from map position…");
      const timestamp = Math.floor(Date.now() / 1000);
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`,
        );
        const payload = (await response.json()) as { timeZoneId?: string };
        if (payload.timeZoneId) {
          setTimezone(payload.timeZoneId);
          setLocationStatus(`Timezone auto-set to ${payload.timeZoneId}`);
        } else {
          setLocationStatus("Map lookup active; timezone unchanged.");
        }
      } catch (err) {
        console.error(err);
        setLocationStatus("Timezone lookup unavailable; using device timezone.");
      }
    },
    [],
  );

  const updateMapFromCoords = useCallback(
    (lat: number, lng: number) => {
      setMapPreview(`${lat.toFixed(3)}, ${lng.toFixed(3)}`);
      const googleApi = (window as typeof window & { google?: { maps?: GoogleMapsApi } }).google;
      if (!googleApi?.maps || !mapCanvasRef.current) return;
      if (!mapHandleRef.current.map) {
        const map = new googleApi.maps.Map(mapCanvasRef.current, {
          center: { lat, lng },
          zoom: 4,
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
          void updateTimezoneFromCoords(nextLat, nextLng);
        });
      } else if (mapHandleRef.current.map) {
        mapHandleRef.current.map.setCenter({ lat, lng });
        if (mapHandleRef.current.marker) {
          mapHandleRef.current.marker.setPosition({ lat, lng });
        }
      }
    },
    [resolvePlaceFromCoords, updateTimezoneFromCoords],
  );

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>, source: "auto" | "manual" = "manual") => {
    event?.preventDefault();
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;
    if (source === "manual") {
      triggerSubmitFeedback();
    }
    if (!hasRequiredDetails) {
      setError("Add date, time, and place to convert.");
      return;
    }

    setError(null);
    setLoading(true);
    setSyncNotice(null);
    setRefreshing(Boolean(payload));
    try {
      const response = await requestCalendar(details);
      if (currentRequestId !== requestIdRef.current || !isMountedRef.current) return;

      setPayload(response);

      const calendarPayload: CalendarPayload | undefined =
        typeof response === "object" && response && "saka_date" in response
          ? (response as CalendarPayload)
          : undefined;

      const sakaDate = calendarPayload?.saka_date
        ? {
            year: calendarPayload.saka_date.year,
            month: calendarPayload.saka_date.month,
            monthIndex: calendarPayload.saka_date.month_index,
            day: calendarPayload.saka_date.day,
            leapYear: calendarPayload.saka_date.leap_year,
          }
        : undefined;

      const derivedGrid = deriveHouseGrid(
        details,
        (sakaDate as { month?: string } | undefined)?.month,
        (sakaDate as { day?: number } | undefined)?.day,
      );

      const sakaLabelFromResponse = formatSakaLabel(sakaDate);
      const placements = deriveHousePlacements(
        derivedGrid,
        (sakaDate as { day?: number } | undefined)?.day,
      );

      saveBirthDetails(
        {
          ...details,
          timezone,
          ...placements,
          sakaMonth: (sakaDate as { month?: string } | undefined)?.month,
          sakaDay: (sakaDate as { day?: number } | undefined)?.day,
          houseGrid: derivedGrid,
          sakaLabel: sakaLabelFromResponse,
        },
        { autoSubmit: true },
      );

      if (!isMountedRef.current) return;

      setHouseGrid(derivedGrid);
      updateSaka({
        details,
        sakaDate,
        sakaLabel: sakaLabelFromResponse,
        houseGrid: derivedGrid,
        panchang: calendarPayload
          ? {
              tithiName: calendarPayload.tithi_name,
              nakshatra: calendarPayload.nakshatra,
              yoga: calendarPayload.yoga,
              karana: calendarPayload.karana,
              weekday: calendarPayload.weekday,
              conversionFactorYears: calendarPayload.conversion_factor_years,
              istLongitude: calendarPayload.ist_reference_longitude,
              sources: calendarPayload.sources,
              ephemerisSource: calendarPayload.ephemeris_source,
            }
          : undefined,
        payload: response,
      });
      setAutoTriggered(source === "auto");
      setRefreshing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to convert date";
      if (currentRequestId !== requestIdRef.current || !isMountedRef.current) return;
      const hint = message.includes("backend hosts")
        ? `${message}. Using demo Śaka data until an API endpoint is configured.`
        : message;
      setError(hint);
      captureClientError(hint, { details, feature: "calendar" });
    } finally {
      if (currentRequestId === requestIdRef.current && isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!hasRequiredDetails) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      handleSubmit(undefined, "auto");
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [details, hasRequiredDetails]);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || !placeInputRef.current || autocompleteRef.current) {
      if (!apiKey) {
        setLocationStatus("Add a Maps API key to enable place search and timezone detection.");
      }
      return;
    }

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
          void updateTimezoneFromCoords(lat, lng);
        }
      });
      setLocationStatus("Map suggestions ready. Pick a result to auto-fill.");

      if (mapCanvasRef.current && !mapHandleRef.current.map) {
        updateMapFromCoords(20.5937, 78.9629);
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
  }, [updateMapFromCoords, updateTimezoneFromCoords]);

  const sakaDate = useMemo(() => {
    if (!payload || typeof payload !== "object" || !("saka_date" in payload)) return undefined;
    const sakaPayload = (payload as CalendarPayload).saka_date;
    return sakaPayload
      ? {
          year: sakaPayload.year,
          month: sakaPayload.month,
          monthIndex: sakaPayload.month_index,
          day: sakaPayload.day,
          leapYear: sakaPayload.leap_year,
        }
      : undefined;
  }, [payload]);

  const sakaLabel = useMemo(() => {
    return formatSakaLabel(sakaDate);
  }, [sakaDate]);

  const sakaMonthIndex = useMemo(() => {
    if (sakaDate?.monthIndex) return sakaDate.monthIndex;
    if (sakaDate?.month) {
      const index = SAKA_MONTHS.findIndex((month) => month.toLowerCase() === sakaDate.month?.toLowerCase());
      return index >= 0 ? index + 1 : undefined;
    }
    return undefined;
  }, [sakaDate?.month, sakaDate?.monthIndex]);

  const wheelRotation = useMemo(() => {
    if (!sakaMonthIndex) return 0;
    return ((sakaMonthIndex - 1) / 12) * 360;
  }, [sakaMonthIndex]);

  const calendarPayload = useMemo(() => {
    if (!payload || typeof payload !== "object") return undefined;
    return payload as CalendarPayload;
  }, [payload]);

  const sakaDashboard = useMemo(
    () =>
      [
        { label: "Tithi", value: calendarPayload?.tithi_name },
        { label: "Nakshatra", value: calendarPayload?.nakshatra },
        { label: "Yoga", value: calendarPayload?.yoga },
        { label: "Karana", value: calendarPayload?.karana },
        { label: "Weekday (IST)", value: calendarPayload?.weekday },
        {
          label: "Conversion offset",
          value:
            calendarPayload?.conversion_factor_years !== undefined
              ? `${calendarPayload.conversion_factor_years} years from Gregorian`
              : undefined,
        },
        {
          label: "IST reference", 
          value: calendarPayload?.ist_reference_longitude
            ? `${calendarPayload.ist_reference_longitude}°E (Allahabad meridian)`
            : undefined,
        },
        { label: "Ephemeris", value: calendarPayload?.ephemeris_source },
        {
          label: "Source texts",
          value: calendarPayload?.sources?.length ? calendarPayload.sources.join(" · ") : undefined,
        },
        { label: "Leap year", value: sakaDate?.leapYear === undefined ? undefined : sakaDate.leapYear ? "Yes" : "No" },
        {
          label: "Month index",
          value:
            sakaDate?.monthIndex !== undefined && sakaDate?.month
              ? `${sakaDate.month} is month ${sakaDate.monthIndex}`
              : sakaDate?.monthIndex !== undefined
                ? `Month ${sakaDate.monthIndex}`
                : undefined,
        },
      ].filter((item) => item.value),
    [calendarPayload?.conversion_factor_years, calendarPayload?.ephemeris_source, calendarPayload?.ist_reference_longitude, calendarPayload?.karana, calendarPayload?.nakshatra, calendarPayload?.sources, calendarPayload?.tithi_name, calendarPayload?.weekday, calendarPayload?.yoga, sakaDate?.leapYear, sakaDate?.month, sakaDate?.monthIndex],
  );

  const handleExport = () => {
    if (!payload) {
      setError("Run a conversion before exporting.");
      return;
    }

    const exportPayload = {
      generated_at: new Date().toISOString(),
      gregorian: {
        ...details,
        timezone,
        resolved_place: resolvedPlace,
      },
      saka: sakaDate,
      calendar: calendarPayload,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "saka-conversion.json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleInsertToEngines = () => {
    if (!details.birthDate || !details.birthTime || !details.birthPlace) {
      setError("Fill date, time, and place before sending to other engines.");
      return;
    }

    const derivedGrid = houseGrid.length ? houseGrid : deriveHouseGrid(details);
    const placements = deriveHousePlacements(derivedGrid, sakaDate?.day);

    saveBirthDetails(
      {
        ...details,
        timezone,
        ...placements,
        sakaMonth: sakaDate?.month,
        sakaDay: sakaDate?.day,
        sakaLabel,
        houseGrid: derivedGrid,
      },
      { autoSubmit: true },
    );

    setSyncNotice("Details pinned for horoscope, future, matchmaking, and past-life engines.");
  };

  return (
    <section aria-labelledby="calendar-heading">
      <form onSubmit={(event) => handleSubmit(event, "manual")} aria-busy={loading}>
        <header className="section-heading">
          <p className="eyebrow">Śaka conversion</p>
          <h2 id="calendar-heading">{t("calendar.title", "Gregorian → Śaka calendar conversion")}</h2>
          <BackendHealthNotice />
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
              ref={placeInputRef}
              required
              value={details.birthPlace}
              onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })}
            />
          </div>
          <div>
            <label htmlFor="calendar-timezone">Timezone (auto-detected)</label>
            <input
              id="calendar-timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="Asia/Kolkata"
            />
          </div>
        </div>
        <div className="calendar-map">
          <div className="calendar-map__canvas" ref={mapCanvasRef} aria-label="Map selector for place accuracy" />
          <div className="calendar-map__meta">
            <p className="muted">
              Pick a city or click the map to lock coordinates. The timezone updates automatically when available.
            </p>
            <div className="calendar-map__badges">
              <span className="badge">{locationStatus}</span>
              {mapPreview && <span className="badge">Pin: {mapPreview}</span>}
              {resolvedPlace && <span className="badge">Resolved: {resolvedPlace}</span>}
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button
            type="submit"
            disabled={loading || !hasRequiredDetails}
            aria-label={t("calendar.title", "Convert Gregorian birth details to Śaka")}
            className="ghost-button"
          >
            {loading
              ? t("form.loading", "Consulting Bhrigu...")
              : autoTriggered
                ? t("calendar.refresh", "Refresh conversion")
                : t("calendar.title", "Convert Gregorian birth details to Śaka")}
          </button>
          <span className="badge" aria-live="polite">
            {refreshing
              ? "Refreshing Śaka conversion while keeping the last result visible"
              : autoTriggered
                ? t("calendar.badge.live", "Live conversion applied")
                : t("calendar.badge.pending", "Auto converts when details are filled")}
          </span>
        </div>
        <div className="form-actions" style={{ gap: "12px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="button-link"
            onClick={handleInsertToEngines}
            disabled={loading || !hasRequiredDetails}
          >
            Insert Śaka details into other engines
          </button>
          <button type="button" className="ghost-button" onClick={handleExport} disabled={!payload}>
            Export conversion
          </button>
          {syncNotice && <span className="badge">{syncNotice}</span>}
        </div>
        {error && (
          <div className="error-banner" role="alert" aria-live="assertive" tabIndex={-1} ref={errorRef}>
            {t("form.error", error)}
          </div>
        )}
      </form>
      <div className="cosmic-houses" aria-live="polite">
        <div className="cosmic-houses__header">
          <div>
            <p className="eyebrow">Śaka calendar</p>
            <h3>{sakaLabel}</h3>
            <p className="muted">Updated automatically after each conversion.</p>
          </div>
        </div>
        <div className="cosmic-houses__grid" role="list">
          {(houseGrid.length ? houseGrid : deriveHouseGrid(details)).map((house) => (
            <article
              key={house.index}
              className="cosmic-houses__card"
              role="listitem"
              aria-label={`House ${house.index}: ${house.focus} in ${house.sign}`}
            >
              <div className="cosmic-houses__orbit" aria-hidden="true">
                <span className="cosmic-houses__pulse" />
                <span className="cosmic-houses__planet" />
              </div>
              <div className="cosmic-houses__meta">
                <div className="cosmic-houses__label">
                  <span className="badge">House {house.index}</span>
                  <span className="house-sign">{house.sign}</span>
                </div>
                <p className="house-element">
                  <span role="img" aria-label={house.element}>
                    {house.glyph}
                  </span>{" "}
                  {house.element}
                </p>
                <p className="house-focus">{house.focus}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="panel softly" aria-live="polite" aria-label="Śaka calendar dashboard">
        <p className="eyebrow">Śaka dashboard</p>
        <h3>{sakaLabel}</h3>
        <p className="muted">Cross-check Panchang details before sending to other engines.</p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "12px" }}>
          {sakaDashboard.length === 0 && <li className="muted">Awaiting Śaka conversion data.</li>}
          {sakaDashboard.map((item) => (
            <li key={`${item.label}-${item.value}`} className="key-value">
              <div style={{ fontWeight: 600 }}>{item.label}</div>
              <div className="muted">{item.value}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel softly" aria-live="polite" aria-label="Śaka calendar wheel">
        <p className="eyebrow">Śaka wheel</p>
        <div className="calendar-wheel" style={{ "--wheel-rotation": `${wheelRotation}deg` } as CSSProperties}>
          <div className="calendar-wheel__ring" aria-hidden="true">
            {SAKA_MONTHS.map((month, index) => (
              <span
                key={month}
                className="calendar-wheel__tick"
                style={{ "--tick-rotation": `${index * 30}deg` } as CSSProperties}
              />
            ))}
            <span className="calendar-wheel__marker" />
          </div>
          <div className="calendar-wheel__center">
            <p className="muted">Śaka date</p>
            <strong>{sakaDate?.day ? `${sakaDate.day} ${sakaDate.month ?? ""}`.trim() : "Awaiting date"}</strong>
            <span className="muted">{sakaDate?.year ?? "—"}</span>
          </div>
        </div>
        <div className="calendar-wheel__legend">
          {SAKA_MONTHS.map((month, index) => (
            <span
              key={month}
              className={`calendar-wheel__legend-item${sakaMonthIndex === index + 1 ? " is-active" : ""}`}
            >
              {month}
            </span>
          ))}
        </div>
      </div>
      <PredictionCard title="Calendar context" payload={payload} engine="calendar" />
    </section>
  );
}
