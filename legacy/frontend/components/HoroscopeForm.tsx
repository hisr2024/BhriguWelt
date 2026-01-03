'use client';

import { FormEvent, useEffect, useMemo, useState } from "react";

import { deriveChartHouses } from "@/lib/houseGrid";
import { getFallbackSample } from "@/lib/api";
import { useImmersiveFeedback } from "@/lib/immersive";
import { theme } from "@/lib/theme";
import { CalendarDetails } from "@/types/astro";
import { deriveHousePlacements, useSakaContext } from "@/lib/sakaContext";

import FormPanel from "./horoscope/FormPanel";
import ReadingPanel from "./horoscope/ReadingPanel";
import { ChartResponse, FormState, FormStatus, Interpretation } from "./horoscope/types";
import { extractInterpretation, isNatalChart, postChart, sanitize } from "./horoscope/utils";

const defaultForm: FormState = {
  name: "",
  dateOfBirth: "",
  timeOfBirth: "",
  placeOfBirth: "",
  tradition: "universal",
  lunarTithi: 0,
  moonElement: "",
  marsHouse: 0,
  saturnHouse: 0,
  venusHouse: 0,
  rahuAspectsAscendant: false,
  ketuHouse: 0,
  mercuryHouse: 0,
  jupiterHouse: 0,
  saturnRetrograde: false,
};

type ValidationState = {
  dob?: string;
  tob?: string;
  pob?: string;
};

const HOROSCOPE_PENDING_SUMMARY = "Based on your inputs, a full reading is pending backend connection.";
const PAST_LIFE_GENERIC = "Past-life memories may involve healing or service roles.";

function buildCalendarDetails(form: FormState): CalendarDetails {
  return {
    birthDate: form.dateOfBirth || new Date().toISOString().slice(0, 10),
    birthTime: form.timeOfBirth || "00:00",
    birthPlace: form.placeOfBirth || "stated place",
  } satisfies CalendarDetails;
}

function hydrateCharts(payload: ChartResponse, form: FormState): ChartResponse {
  if (!payload || isNatalChart(payload)) return payload;

  const typed = payload as { rashi_chart?: unknown; bhava_chart?: unknown; dashas?: unknown };
  const hasRashi = Array.isArray(typed.rashi_chart) && typed.rashi_chart.length >= 12;
  const hasBhava = Array.isArray(typed.bhava_chart) && typed.bhava_chart.length >= 12;

  if (hasRashi && hasBhava) return payload;

  const details = buildCalendarDetails(form);
  const generatedRashi = deriveChartHouses(details);
  const generatedBhava = deriveChartHouses(details, { offset: 1 });

  return {
    ...payload,
    rashi_chart: hasRashi ? typed.rashi_chart : generatedRashi,
    bhava_chart: hasBhava ? typed.bhava_chart : generatedBhava,
    dashas: Array.isArray(typed.dashas) ? typed.dashas : [],
  } as ChartResponse;
}

function buildFallbackInterpretation(): Interpretation {
  const horoscopeSample = getFallbackSample("/horoscope");
  const pastLifeSample = getFallbackSample("/past-life");

  const horoscopeInterpretation =
    typeof (horoscopeSample as { interpretation?: unknown })?.interpretation === "string"
      ? (horoscopeSample as { interpretation: string }).interpretation
      : undefined;
  const horoscopeInterpretationHindi =
    typeof (horoscopeSample as { interpretation_hi?: unknown })?.interpretation_hi === "string"
      ? (horoscopeSample as { interpretation_hi: string }).interpretation_hi
      : undefined;
  const horoscopeSummary =
    typeof (horoscopeSample as { karmic_epoch?: unknown })?.karmic_epoch === "string"
      ? (horoscopeSample as { karmic_epoch: string }).karmic_epoch
      : undefined;

  const pastLifeInsights = (sample: Record<string, unknown> | null | undefined) => {
    if (!sample) return undefined;
    const typedSample = sample as { insights?: unknown[]; past_life_insights?: unknown[] };
    const insights = Array.isArray(typedSample.insights)
      ? typedSample.insights
      : Array.isArray(typedSample.past_life_insights)
        ? typedSample.past_life_insights
        : undefined;

    if (!insights?.length) return undefined;

    const firstInsight = insights.find((entry) => typeof (entry as { narrative?: unknown }).narrative === "string");
    return firstInsight ? (firstInsight as { narrative: string }).narrative : undefined;
  };

  const pastLifeNarrative = pastLifeInsights(pastLifeSample) || pastLifeInsights(horoscopeSample);

  const englishBlocks = [HOROSCOPE_PENDING_SUMMARY];
  if (horoscopeInterpretation) englishBlocks.push(horoscopeInterpretation);
  if (pastLifeNarrative || PAST_LIFE_GENERIC) englishBlocks.push(`Past-life: ${pastLifeNarrative || PAST_LIFE_GENERIC}`);

  return {
    english: englishBlocks.join("\n\n"),
    hindi: horoscopeInterpretationHindi,
    raw: horoscopeSample ? JSON.stringify(horoscopeSample, null, 2) : undefined,
    summary: horoscopeSummary || HOROSCOPE_PENDING_SUMMARY,
  };
}

export default function HoroscopeForm() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [interpretation, setInterpretation] = useState<Interpretation>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [, setStatus] = useState<FormStatus>("idle");
  const [validations, setValidations] = useState<ValidationState>({});

  const { triggerSubmitFeedback } = useImmersiveFeedback();
  const { sakaState } = useSakaContext();

  const fallbackInterpretation = useMemo(() => buildFallbackInterpretation(), []);
  const fallbackChartSample = useMemo(() => getFallbackSample("/horoscope") as ChartResponse | null, []);

  const isComplete = useMemo(
    () => Boolean(form.name && form.dateOfBirth && form.timeOfBirth && form.placeOfBirth),
    [form.name, form.dateOfBirth, form.placeOfBirth, form.timeOfBirth],
  );
  const missingFields = useMemo(
    () =>
      ([
        ["dob", form.dateOfBirth, "date of birth"],
        ["tob", form.timeOfBirth, "time of birth"],
        ["pob", form.placeOfBirth, "place of birth"],
      ] as const)
        .filter(([, value]) => !value)
        .map(([, , label]) => label),
    [form.dateOfBirth, form.placeOfBirth, form.timeOfBirth],
  );
  const formattedChart = useMemo(() => (chart ? JSON.stringify(chart, null, 2) : ""), [chart]);
  const hasNarrative = Boolean(interpretation.english || interpretation.hindi);
  const fallbackNarrative = interpretation.raw || formattedChart || "No interpretation available";

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const validate = (payload: FormState): ValidationState => {
    const feedback: ValidationState = {};

    if (payload.dateOfBirth) {
      const year = Number(payload.dateOfBirth.split("-")[0]);
      if (year < 1900 || year > 2100) {
        feedback.dob = "Try a date within 1900-2100";
      }
    }

    if (payload.timeOfBirth && !/^\d{2}:\d{2}$/.test(payload.timeOfBirth)) {
      feedback.tob = "Use HH:MM in 24h format (e.g., 07:45)";
    }

    if (payload.placeOfBirth && payload.placeOfBirth.length < 3) {
      feedback.pob = "Add at least 3 characters (city, country)";
    }

    return feedback;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    triggerSubmitFeedback();
    setError(null);
    setStatus("idle");
    setChart(null);
    setEndpoint(null);
    setInterpretation({});

    if (missingFields.length || Object.keys(validations).length) {
      setError("Please fix the highlighted birth details.");
      return;
    }

    setLoading(true);

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
    const normalizedBackend = backendUrl ? backendUrl.replace(/\/$/, "") : null;

    const requestPayload = {
      name: form.name,
      dateOfBirth: form.dateOfBirth,
      timeOfBirth: form.timeOfBirth,
      placeOfBirth: form.placeOfBirth,
    } satisfies FormState;

    const handleSuccess = (data: ChartResponse, path: string) => {
      const hydrated = hydrateCharts(data, form);
      const extracted = extractInterpretation(hydrated);

      const resolvedInterpretation =
        extracted.english || extracted.hindi
          ? extracted
          : {
              ...fallbackInterpretation,
              raw: extracted.raw || fallbackInterpretation.raw,
              summary: extracted.summary || fallbackInterpretation.summary,
            };

      setEndpoint(path);
      setChart(hydrated);
      setInterpretation(resolvedInterpretation);
      setStatus("success");

      if (!extracted.english && !extracted.hindi) {
        console.warn("[HoroscopeForm] No narrative returned; falling back to raw output", {
          path,
          payload: requestPayload,
          response: data,
        });
        setError(
          "Live response did not include a narrative. Showing a curated sample reading until the backend reconnects.",
        );
      }
    };

    const attempt = async (path: string, baseUrl?: string) => {
      const endpointPath = baseUrl ? `${baseUrl}${path}` : path;
      console.info("[HoroscopeForm] Submitting horoscope request", {
        path: endpointPath,
        payload: requestPayload,
      });
      try {
        const data = await postChart(path, form, baseUrl || undefined);
        handleSuccess(data, endpointPath);
      } catch (submissionError) {
        console.error(`[HoroscopeForm] Submission to ${endpointPath} failed`, submissionError, {
          payload: requestPayload,
        });
        throw submissionError;
      }
    };

    const attemptBackend = async () => {
      if (!normalizedBackend) return false;

      try {
        const horoscopeResponse = await postChart("/horoscope", form, normalizedBackend);
        let combinedResponse: ChartResponse = horoscopeResponse;

        try {
          const pastLifeResponse = await postChart("/past-life", form, normalizedBackend);
          combinedResponse = {
            ...(horoscopeResponse as Record<string, unknown>),
            past_life_report: pastLifeResponse,
            past_life_insights:
              (horoscopeResponse as { past_life_insights?: unknown[] }).past_life_insights ||
              (pastLifeResponse as { insights?: unknown[] }).insights,
          } as ChartResponse;
        } catch (pastLifeError) {
          console.warn("[HoroscopeForm] Past-life endpoint unavailable; continuing with horoscope output", pastLifeError);
        }

        handleSuccess(combinedResponse, `${normalizedBackend}/horoscope`);
        return true;
      } catch (backendError) {
        console.error("[HoroscopeForm] Backend endpoints failed", backendError, {
          payload: requestPayload,
          backend: normalizedBackend,
        });
        return false;
      }
    };

    try {
      const backendSucceeded = await attemptBackend();

      if (!backendSucceeded) {
        try {
          await attempt("/api/chart");
        } catch (primaryError) {
          console.error("[HoroscopeForm] Primary endpoint failed; attempting fallback", primaryError);
          try {
            await attempt("/api/bhrigu-chat");
          } catch (fallbackError) {
            console.error("[HoroscopeForm] Fallback endpoint also failed", fallbackError);
            throw primaryError;
          }
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to generate chart";
      const normalizedMessage = /Failed to fetch/i.test(message)
        ? "Backend unreachable. Please check your connection and try again."
        : `Data processing failed: ${message}`;
      console.error("[HoroscopeForm] Submission aborted", err, { payload: requestPayload });
      setError(normalizedMessage);
      if (fallbackChartSample) {
        setChart(hydrateCharts(fallbackChartSample, form));
      }
      setInterpretation(fallbackInterpretation);
      setStatus("success");
    } finally {
      setLoading(false);
    }
  };

  const buildShareText = () => {
    const segments = [interpretation.summary, interpretation.english, interpretation.hindi].filter(Boolean);
    return segments.length ? segments.join("\n\n") : fallbackNarrative;
  };

  const handleShareResults = async () => {
    if (!chart || typeof window === "undefined") return;
    const text = buildShareText();
    if (!text) return;

    if ("share" in navigator) {
      try {
        await navigator.share({ title: "BhriguWelt reading", text });
        return;
      } catch (error) {
        console.warn("[HoroscopeForm] Share cancelled", error);
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        console.warn("[HoroscopeForm] Clipboard write failed", error);
      }
    }
  };

  const handlePlayVoice = () => {
    if (typeof window === "undefined") return;
    const text = buildShareText();
    if (!text) return;
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (synth.speaking) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const preferredVoice =
      voices.find((voice) => /en-in/i.test(voice.lang)) ||
      voices.find((voice) => /en-us/i.test(voice.lang)) ||
      voices.find((voice) => /en/i.test(voice.lang)) ||
      voices[0];

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      utterance.lang = preferredVoice.lang;
    } else {
      utterance.lang = "en-IN";
    }

    utterance.rate = 0.98;
    synth.speak(utterance);
  };

  const handleDownloadPdf = () => {
    if (!chart || typeof window === "undefined") return;
    const printable = window.open("", "_blank", "noopener,noreferrer,width=900,height=1200");
    if (!printable) return;

    const safeEnglish = interpretation.english ? sanitize(interpretation.english) : "";
    const safeHindi = interpretation.hindi ? sanitize(interpretation.hindi) : "";
    const safeChart = formattedChart ? sanitize(formattedChart) : "";
    const safeSummary = interpretation.summary ? sanitize(interpretation.summary) : "";

    const englishBlock =
      safeEnglish &&
      `<section><h2>Interpretation (English)</h2><pre>${safeEnglish}</pre></section>`;
    const hindiBlock = safeHindi && `<section><h2>Interpretation (Hindi)</h2><pre>${safeHindi}</pre></section>`;
    const summaryBlock = safeSummary && `<p class="meta">${safeSummary}</p>`;
    const rawBlock =
      !safeEnglish && !safeHindi && safeChart
        ? `<section><h2>Raw chart details</h2><pre>${safeChart}</pre></section>`
        : "";

    printable.document.write(`
      <html>
        <head>
          <title>Holistic Horoscope</title>
          <style>
            body { font-family: "Inter", system-ui, -apple-system, sans-serif; background: ${theme.gradients.backdrop}; color: ${theme.colors.text}; margin: 0; padding: 32px; }
            h1 { margin-top: 0; letter-spacing: 0.02em; }
            .meta { color: ${theme.colors.muted}; margin-bottom: 24px; }
            pre { white-space: pre-wrap; word-break: break-word; background: ${theme.colors.canvasSurface}; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 16px; color: ${theme.colors.canvasText}; }
            section { margin-bottom: 18px; }
          </style>
        </head>
        <body>
          <h1>Holistic Horoscope</h1>
          <p class="meta">Generated from name, date of birth, time of birth, and place of birth.</p>
          ${summaryBlock || ""}
          ${englishBlock || ""}
          ${hindiBlock || ""}
          ${rawBlock || ""}
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  useEffect(() => {
    setValidations(validate(form));
  }, [form]);

  useEffect(() => {
    if (!sakaState.houseGrid?.length && !sakaState.details) return;
    const placements = deriveHousePlacements(sakaState.houseGrid || [], sakaState.sakaDate?.day);
    const normalize = (value?: string) => {
      if (!value) return undefined;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    };
    setForm((prev) => ({
      ...prev,
      dateOfBirth: sakaState.details?.birthDate || prev.dateOfBirth,
      timeOfBirth: sakaState.details?.birthTime || prev.timeOfBirth,
      placeOfBirth: sakaState.details?.birthPlace || prev.placeOfBirth,
      lunarTithi: placements.lunarTithi ? Number(placements.lunarTithi) : prev.lunarTithi,
      moonElement: placements.moonElement || prev.moonElement,
      marsHouse: normalize(placements.marsHouse) ?? prev.marsHouse,
      saturnHouse: normalize(placements.saturnHouse) ?? prev.saturnHouse,
      venusHouse: normalize(placements.venusHouse) ?? prev.venusHouse,
      ketuHouse: normalize(placements.ketuHouse) ?? prev.ketuHouse,
      mercuryHouse: normalize(placements.mercuryHouse) ?? prev.mercuryHouse,
      jupiterHouse: normalize(placements.jupiterHouse) ?? prev.jupiterHouse,
      rahuAspectsAscendant:
        placements.rahuAspectsAscendant !== undefined
          ? placements.rahuAspectsAscendant
          : prev.rahuAspectsAscendant,
    }));
  }, [sakaState.details?.birthDate, sakaState.details?.birthPlace, sakaState.details?.birthTime, sakaState.houseGrid, sakaState.sakaDate]);

  useEffect(() => {
    if (!missingFields.length && !Object.keys(validations).length) {
      setError(null);
    }
  }, [missingFields, validations]);

  return (
    <section className="horo-board" aria-label="Horoscope creation">
      <div className="horo-layout">
        <FormPanel
          form={form}
          loading={loading}
          endpoint={endpoint}
          error={error}
          isComplete={isComplete}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />

        <ReadingPanel
          chart={chart}
          form={form}
          interpretation={interpretation}
          hasNarrative={hasNarrative}
          fallbackNarrative={fallbackNarrative}
          onShare={handleShareResults}
          onPlayVoice={handlePlayVoice}
          onDownloadPdf={handleDownloadPdf}
        />
      </div>
    </section>
  );
}
