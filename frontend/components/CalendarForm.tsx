'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { requestCalendar } from "@/lib/api";
import { deriveHouseGrid, HouseSummary } from "@/lib/houseGrid";
import { useI18n } from "@/lib/i18n";
import { captureClientError } from "@/lib/telemetry";
import { CalendarDetails } from "@/types/astro";
import { useImmersiveFeedback } from "@/lib/immersive";
import PredictionCard from "./PredictionCard";
import BackendHealthNotice from "@/components/BackendHealthNotice";
import { loadBirthDetails, onBirthDetails, saveBirthDetails } from "@/lib/birthStorage";
import { deriveHousePlacements, useSakaContext } from "@/lib/sakaContext";

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
  const errorRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const { triggerSubmitFeedback } = useImmersiveFeedback();
  const { updateSaka } = useSakaContext();

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
  }, [details.birthDate, details.birthPlace, details.birthTime]);

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>, source: "auto" | "manual" = "manual") => {
    event?.preventDefault();
    if (source === "manual") {
      triggerSubmitFeedback();
    }
    if (!details.birthDate || !details.birthTime || !details.birthPlace) {
      setError("Add date, time, and place to convert.");
      return;
    }

    setError(null);
    setPayload(null);
    setLoading(true);
    setSyncNotice(null);
    try {
      const response = await requestCalendar(details);
      setPayload(response);
      const sakaDate = typeof response === "object" && response && "saka_date" in response ? response.saka_date : undefined;
      const derivedGrid = deriveHouseGrid(
        details,
        (sakaDate as { month?: string } | undefined)?.month,
        (sakaDate as { day?: number } | undefined)?.day,
      );
      setHouseGrid(derivedGrid);
      updateSaka({
        details,
        sakaDate: sakaDate as { year?: number; month?: string; day?: number },
        houseGrid: derivedGrid,
        payload: response,
      });
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
          sakaLabel: sakaLabel,
        },
        { autoSubmit: true },
      );
      setAutoTriggered(source === "auto");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to convert date";
      setError(message);
      captureClientError(message, { details, feature: "calendar" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!details.birthDate || !details.birthTime || !details.birthPlace) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      handleSubmit(undefined, "auto");
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [details]);

  const sakaDate = useMemo(() => {
    if (!payload || typeof payload !== "object" || !("saka_date" in payload)) return undefined;
    return (payload as { saka_date?: { year?: number; month?: string; day?: number } }).saka_date;
  }, [payload]);

  const sakaLabel = useMemo(() => {
    if (!sakaDate) return "Awaiting Śaka conversion";
    return `Śaka ${sakaDate.year ?? ""} ${sakaDate.month ?? ""} ${sakaDate.day ?? ""}`.trim();
  }, [sakaDate]);

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
            disabled={loading}
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
            {autoTriggered
              ? t("calendar.badge.live", "Live conversion applied")
              : t("calendar.badge.pending", "Auto converts when details are filled")}
          </span>
        </div>
        <div className="form-actions" style={{ gap: "12px", flexWrap: "wrap" }}>
          <button type="button" className="button-link" onClick={handleInsertToEngines} disabled={loading}>
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
            <p className="eyebrow">Bharat calendar</p>
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
      <PredictionCard title="Calendar context" payload={payload} engine="calendar" />
    </section>
  );
}
