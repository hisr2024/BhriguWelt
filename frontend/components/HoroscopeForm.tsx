'use client';

import { FormEvent, useMemo, useState } from "react";

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

export default function HoroscopeForm() {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [interpretation, setInterpretation] = useState<Interpretation>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [status, setStatus] = useState<FormStatus>("idle");

  const isComplete = useMemo(() => Object.values(form).every(Boolean), [form]);
  const formattedChart = useMemo(() => (chart ? JSON.stringify(chart, null, 2) : ""), [chart]);
  const hasNarrative = Boolean(interpretation.english || interpretation.hindi);
  const fallbackNarrative = interpretation.raw || formattedChart;

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus("idle");
    setChart(null);
    setEndpoint(null);
    setInterpretation({});
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
