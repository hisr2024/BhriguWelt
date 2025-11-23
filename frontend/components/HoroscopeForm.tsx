'use client';

import { FormEvent, useEffect, useMemo, useState } from "react";

import { theme } from "@/lib/theme";
import FormPanel from "./horoscope/FormPanel";
import ReadingPanel from "./horoscope/ReadingPanel";
import { ChartResponse, FormState, FormStatus, Interpretation } from "./horoscope/types";
import { extractInterpretation, postChart, sanitize } from "./horoscope/utils";

const defaultForm: FormState = {
  name: "",
  dateOfBirth: "",
  timeOfBirth: "",
  placeOfBirth: "",
};

import { interpretChart } from "@/lib/interpretChart";
import { HOUSE_FOCUSES } from "@/lib/houseGrid";
import { NatalChart } from "@/types/natal";
import { useImmersiveFeedback } from "@/lib/immersive";

type FormState = {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
};

type ValidationState = {
  dob?: string;
  tob?: string;
  pob?: string;
};

type ChartResponse = NatalChart | Record<string, unknown>;

type Interpretation = {
  english?: string;
  hindi?: string;
  raw?: string;
  summary?: string;
};

type HouseAnchor = {
  house: number;
  sign: string;
  focus: string;
};

function isNatalChart(payload: ChartResponse): payload is NatalChart {
  if (!payload || typeof payload !== "object") return false;
  const maybeChart = (payload as NatalChart).chart;
  return Boolean(
    maybeChart &&
    typeof maybeChart === "object" &&
    Array.isArray((maybeChart as NatalChart["chart"]).planets) &&
    Array.isArray((maybeChart as NatalChart["chart"]).houses) &&
    (maybeChart as NatalChart["chart"]).ascendant
  );
}

function extractInterpretation(payload: ChartResponse): Interpretation {
  const raw = JSON.stringify(payload, null, 2);
  const typedPayload = payload as {
    interpretation?: unknown;
    interpretation_hi?: unknown;
    karmic_epoch?: unknown;
  };
  const english = typeof typedPayload.interpretation === "string" ? typedPayload.interpretation : undefined;
  const hindi = typeof typedPayload.interpretation_hi === "string" ? typedPayload.interpretation_hi : undefined;
  const summary = typeof typedPayload.karmic_epoch === "string" ? typedPayload.karmic_epoch : undefined;

  if (english || hindi) {
    return { english, hindi, raw, summary };
  }

  if (isNatalChart(payload)) {
    return { english: interpretChart({ chart: payload }), raw, summary };
  }

  return { raw };
}

async function postChart(path: string, payload: FormState) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      birth_date: payload.dateOfBirth,
      birth_time: payload.timeOfBirth,
      birth_place: payload.placeOfBirth.trim(),
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request to ${path} failed`);
  }

  return (await response.json()) as ChartResponse;
}

export default function HoroscopeForm() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [interpretation, setInterpretation] = useState<Interpretation>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");

  const isComplete = useMemo(() => Object.values(form).every(Boolean), [form]);
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
  const hasValidationIssues = useMemo(() => Boolean(Object.keys(validations).length), [validations]);
  const confidenceLabel =
    isComplete && !hasValidationIssues
      ? "Chart confidence: High"
      : "Chart confidence: Add or correct birth details for higher accuracy";
  const formattedChart = useMemo(() => (chart ? JSON.stringify(chart, null, 2) : ""), [chart]);
  const hasNarrative = Boolean(interpretation.english || interpretation.hindi);
  const fallbackNarrative = interpretation.raw || formattedChart;
  const houseFoundation = useMemo<HouseAnchor[] | null>(() => {
    if (!chart || !isNatalChart(chart)) return null;
    return HOUSE_FOCUSES.map((focus, index) => {
      const houseNumber = index + 1;
      const house = chart.chart.houses.find((entry) => entry.number === houseNumber);
      const sign = house?.sign || chart.chart.ascendant?.sign || "—";
      return { house: houseNumber, sign, focus } satisfies HouseAnchor;
    });
  }, [chart]);
  const timeframeAnchors = useMemo(() => {
    const anchors = [
      { label: "Daily", houseIndex: 1 },
      { label: "Weekly", houseIndex: 3 },
      { label: "Monthly", houseIndex: 6 },
      { label: "Yearly", houseIndex: 10 },
    ];

    return anchors.map((anchor) => {
      const foundation = houseFoundation?.find((item) => item.house === anchor.houseIndex);
      return {
        ...anchor,
        focus: foundation?.focus || HOUSE_FOCUSES[anchor.houseIndex - 1],
        sign: foundation?.sign,
      };
    });
  }, [houseFoundation]);
  const progressSteps = useMemo<ProgressStep[]>(() => {
    const steps: ProgressStep[] = [
      {
        title: "Birth details captured",
        description: "Name, date, time, and place locked in.",
        status: isComplete ? "complete" : "active",
      },
      {
        title: "Chart generated",
        description: "Planets and houses mapped in one view.",
        status: chart ? "complete" : isComplete && loading ? "active" : "pending",
      },
      {
        title: "12-house foundation",
        description: "House lords and focuses paired to your ascendant.",
        status: houseFoundation ? "complete" : chart ? "active" : "pending",
      },
      {
        title: "Timeframe guidance",
        description: "Daily to yearly pathways linked to the base chart.",
        status: hasNarrative ? "complete" : chart ? "active" : "pending",
      },
    ];

    return steps;
  }, [chart, hasNarrative, houseFoundation, isComplete, loading]);

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

    if (missingFields.length || Object.keys(validationFeedback).length) {
      setError("Please fix the highlighted birth details.");
      return;
    }

    setLoading(true);

    const attempt = async (path: string) => {
      const data = await postChart(path, form);
      setEndpoint(path);
      setChart(data);
      setInterpretation(extractInterpretation(data));
      setStatus("success");
    };

    try {
      try {
        await attempt("/api/chart");
      } catch (primaryError) {
        try {
          await attempt("/api/bhrigu-chat");
        } catch {
          throw primaryError;
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to generate chart";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAskBhrigu = () => {
    if (!chart || typeof window === "undefined") return;
    const event = new CustomEvent("bhrigu:open-chat", { detail: { chart } });
    window.dispatchEvent(event);
    const chatDock = document.querySelector("[data-bhrigu-chat]");
    if (chatDock instanceof HTMLElement) {
      chatDock.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
    if (!missingFields.length && !Object.keys(validations).length) {
      setError(null);
    }
  }, [missingFields, validations]);

  return (
    <section className="horo-board" aria-label="Horoscope creation">
      <div className="horo-layout">
        <FormPanel
          form={form}
          status={status}
          loading={loading}
          endpoint={endpoint}
          error={error}
          isComplete={isComplete}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onAskBhrigu={handleAskBhrigu}
          onDownloadPdf={handleDownloadPdf}
        />

        <ReadingPanel
          chart={chart}
          form={form}
          interpretation={interpretation}
          hasNarrative={hasNarrative}
          fallbackNarrative={fallbackNarrative}
          onAskBhrigu={handleAskBhrigu}
          onDownloadPdf={handleDownloadPdf}
        />
      </div>
    </section>
  );
}
