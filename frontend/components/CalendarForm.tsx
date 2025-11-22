'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { requestCalendar } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { captureClientError } from "@/lib/telemetry";
import { CalendarDetails } from "@/types/astro";
import { helperCopy } from "@/lib/copy";
import PredictionCard from "./PredictionCard";

type HouseSummary = {
  index: number;
  sign: string;
  focus: string;
  tooltip: string;
};

const HOUSE_FOCUSES = [
  "Self & vitality",
  "Resources & voice",
  "Kin & courage",
  "Home & roots",
  "Learning & joy",
  "Health & discipline",
  "Partnerships",
  "Mysteries & transformation",
  "Dharma & travel",
  "Career & karma",
  "Allies & networks",
  "Rest & subconscious",
];

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

function deriveHouseGrid(details: CalendarDetails, sakaMonth?: string, sakaDay?: number) {
  const dateSeed = details.birthDate ? Date.parse(details.birthDate) : Date.now();
  const [hours, minutes] = details.birthTime.split(":").map((value) => Number(value) || 0);
  const timeSeed = hours * 60 + minutes;
  const placeSeed = details.birthPlace.length;
  const offset = Math.abs(Math.round(dateSeed / 86400000 + timeSeed + placeSeed + (sakaDay || 0))) % 12;

  return HOUSE_FOCUSES.map((focus, index) => {
    const signIndex = (index + offset) % ZODIAC_SIGNS.length;
    const sign = ZODIAC_SIGNS[signIndex];
    const tooltip =
      `House ${index + 1}: ${focus}. Linked to ${sign} ` +
      `by the ${sakaMonth || "Bharat"} rhythm and the longitude anchor at ${details.birthPlace || "the stated place"}.`;

    return {
      index: index + 1,
      focus,
      sign,
      tooltip,
    } satisfies HouseSummary;
  });
}

export default function CalendarForm() {
  const { t } = useI18n();
  const helperText = helperCopy.calendar;
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
  const errorRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleSubmit = async (event?: FormEvent<HTMLFormElement>, source: "auto" | "manual" = "manual") => {
    event?.preventDefault();
    setError(null);
    setPayload(null);
    setLoading(true);
    try {
      const response = await requestCalendar(details);
      setPayload(response);
      const sakaDate = typeof response === "object" && response && "saka_date" in response ? response.saka_date : undefined;
      setHouseGrid(
        deriveHouseGrid(
          details,
          (sakaDate as { month?: string } | undefined)?.month,
          (sakaDate as { day?: number } | undefined)?.day,
        ),
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

  const sakaLabel = useMemo(() => {
    if (!payload || typeof payload !== "object" || !("saka_date" in payload)) return "Śaka conversion ready";
    const sakaDate = (payload as { saka_date?: { year?: number; month?: string; day?: number } }).saka_date;
    if (!sakaDate) return "Śaka conversion ready";
    return `Śaka ${sakaDate.year ?? ""} ${sakaDate.month ?? ""} ${sakaDate.day ?? ""}`.trim();
  }, [payload]);

  return (
    <section aria-labelledby="calendar-heading">
      <form onSubmit={(event) => handleSubmit(event, "manual")} aria-busy={loading} aria-describedby="calendar-helper">
        <header className="section-heading">
          <p className="eyebrow">Śaka conversion</p>
          <h2 id="calendar-heading">{t("calendar.title", "Gregorian → Śaka calendar conversion")}</h2>
          <p className="muted" id="calendar-helper">
            {t(
              "calendar.helper",
              `${helperText} Type the details and the studio converts instantly—no extra clicks needed.`,
            )}
          </p>
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
                ? "Refresh conversion"
                : t("calendar.title", "Convert Gregorian birth details to Śaka")}
          </button>
          <span className="badge" aria-live="polite">
            {autoTriggered ? "Live conversion applied" : "Auto converts when details are filled"}
          </span>
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
            <p className="eyebrow">Bharat calendar instant view</p>
            <h3>{sakaLabel}</h3>
            <p className="muted">
              Conversion runs the moment you share date, time, and place. Each luminous segment maps the twelve houses so first
              time seekers instantly see what was generated.
            </p>
          </div>
          <div className="cosmic-houses__meter" aria-hidden="true">
            <span className="meter-orb" />
            <span className="meter-orb meter-orb--secondary" />
            <span className="meter-orb meter-orb--tertiary" />
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
                <p className="house-focus">{house.focus}</p>
                <p className="muted" title={house.tooltip}>
                  {house.tooltip}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
      <PredictionCard title="Calendar context" payload={payload} engine="calendar" />
    </section>
  );
}
