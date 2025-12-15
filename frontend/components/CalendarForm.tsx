'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

export default function CalendarForm() {
  const { t } = useI18n();
  const [details, setDetails] = useState<CalendarDetails>({
    birthDate: "",
    birthTime: "",
    birthPlace: "",
  });
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
    }

    return onBirthDetails((next) => {
      setDetails((prev) => ({
        birthDate: next.birthDate ?? prev.birthDate,
        birthTime: next.birthTime ?? prev.birthTime,
        birthPlace: next.birthPlace ?? prev.birthPlace,
      }));
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
              required
              value={details.birthPlace}
              onChange={(event) => setDetails({ ...details, birthPlace: event.target.value })}
            />
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
      <PredictionCard title="Calendar context" payload={payload} engine="calendar" />
    </section>
  );
}
