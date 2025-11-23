'use client';

import { FormEvent, useMemo, useState } from "react";

import { interpretChart } from "@/lib/interpretChart";
import { NatalChart } from "@/types/natal";

type FormState = {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
};

type ChartResponse = NatalChart | Record<string, unknown>;

type Interpretation = {
  english?: string;
  hindi?: string;
  raw?: string;
  summary?: string;
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
  const [form, setForm] = useState<FormState>({
    name: "",
    dateOfBirth: "",
    timeOfBirth: "",
    placeOfBirth: "",
  });
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [interpretation, setInterpretation] = useState<Interpretation>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const isComplete = useMemo(() => Object.values(form).every(Boolean), [form]);
  const formattedChart = useMemo(() => (chart ? JSON.stringify(chart, null, 2) : ""), [chart]);
  const hasNarrative = Boolean(interpretation.english || interpretation.hindi);
  const fallbackNarrative = interpretation.raw || formattedChart;

  const sanitize = (value: string) =>
    value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

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
            body { font-family: "Inter", system-ui, -apple-system, sans-serif; background: #04060f; color: #e8edff; margin: 0; padding: 32px; }
            h1 { margin-top: 0; letter-spacing: 0.02em; }
            .meta { color: #cbd5f5; margin-bottom: 24px; }
            pre { white-space: pre-wrap; word-break: break-word; background: #0b1021; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 16px; color: #dbeafe; }
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
        <div className="horo-panel horo-panel--form">
          <div className="panel-head">
            <div>
              <p className="pill">Essentials</p>
              <h2>Input once. Use everywhere.</h2>
              <p className="muted">Simple fields keep the four details aligned for a calm handoff to the reading panel.</p>
            </div>
            <div className="status-chip" aria-live="polite">
              {status === "success" ? "Reading ready" : "Awaiting details"}
            </div>
          </div>

          <form className="horo-form" onSubmit={handleSubmit} aria-busy={loading}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="horoscope-name">Full name</label>
                <input
                  id="horoscope-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Aarya Sen"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
                <p className="microcopy">Name appears on the reading header.</p>
              </div>
            </div>

            <div className="field-row field-row--split">
              <div className="field">
                <label htmlFor="horoscope-dob">Date of birth</label>
                <input
                  id="horoscope-dob"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="horoscope-tob">Time of birth</label>
                <input
                  id="horoscope-tob"
                  name="timeOfBirth"
                  type="time"
                  value={form.timeOfBirth}
                  onChange={(event) => setForm({ ...form, timeOfBirth: event.target.value })}
                  required
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="horoscope-pob">Place of birth</label>
                <input
                  id="horoscope-pob"
                  name="placeOfBirth"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Jaipur, Bharat"
                  value={form.placeOfBirth}
                  onChange={(event) => setForm({ ...form, placeOfBirth: event.target.value })}
                  required
                />
                <p className="microcopy">City or town is enough for a clear horoscope.</p>
              </div>
            </div>

            <div className="action-row">
              <button type="submit" disabled={loading || !isComplete} aria-label="Generate horoscope">
                {loading ? "Preparing your reading..." : "Generate reading"}
              </button>
              <div className="action-notes">
                <p className="microcopy">No extra toggles. We only keep these four inputs for the session.</p>
                {endpoint ? <p className="microcopy">Saved from: {endpoint}</p> : null}
              </div>
            </div>

            {error ? (
              <div className="inline-banner inline-banner--error" role="alert">
                <strong>Something went wrong.</strong>
                <p className="microcopy">{error}</p>
              </div>
            ) : null}

            {status === "success" ? (
              <div className="inline-banner inline-banner--success" role="status">
                <div>
                  <strong>Reading captured.</strong>
                  <p className="microcopy">Send it to chat or save as a PDF from the interpretation panel.</p>
                </div>
                <div className="banner-actions">
                  <button type="button" className="ghost-button" onClick={handleAskBhrigu}>
                    Ask in chat
                  </button>
                  <button type="button" className="ghost-button" onClick={handleDownloadPdf}>
                    Download PDF
                  </button>
                </div>
              </div>
            ) : null}
          </form>
        </div>

        <div className="horo-panel horo-panel--reading" aria-live="polite">
          <div className="panel-head">
            <div>
              <p className="pill">Interpretation</p>
              <h2>Wide, readable canvas</h2>
              <p className="muted">English and Hindi guidance sits on a calm background with generous spacing for long reads.</p>
            </div>
            {chart ? (
              <div className="status-chip status-chip--ready">Ready to share</div>
            ) : (
              <div className="status-chip">Waiting for inputs</div>
            )}
          </div>

          {chart ? (
            <div className="reading-surface">
              <div className="reading-toolbar">
                <div>
                  <p className="microcopy">Generated from your four essentials</p>
                  <strong>{form.name || "Reader"}</strong>
                </div>
                <div className="toolbar-actions">
                  <button type="button" className="ghost-button" onClick={handleAskBhrigu}>
                    Ask in chat
                  </button>
                  <button type="button" className="ghost-button" onClick={handleDownloadPdf}>
                    Save PDF
                  </button>
                </div>
              </div>

              <div className="interpretation-grid">
                <div className="interpretation-canvas">
                  <div className="canvas-head">
                    <div>
                      <p className="microcopy">Live interpretation</p>
                      <h3 className="canvas-title">Calm, printable language</h3>
                    </div>
                    {interpretation.summary ? <span className="pill">{interpretation.summary}</span> : null}
                  </div>

                  {hasNarrative ? (
                    <>
                      {interpretation.english ? (
                        <section>
                          <p className="microcopy">English</p>
                          <pre aria-live="polite">{interpretation.english}</pre>
                        </section>
                      ) : null}
                      {interpretation.hindi ? (
                        <section>
                          <p className="microcopy">हिंदी मार्गदर्शन</p>
                          <pre aria-live="polite">{interpretation.hindi}</pre>
                        </section>
                      ) : null}
                    </>
                  ) : (
                    <section>
                      <p className="microcopy">Raw data (waiting for narrative)</p>
                      <pre aria-live="polite">{fallbackNarrative}</pre>
                    </section>
                  )}
                </div>

                <aside className="interpretation-notes">
                  <h4>Share or download</h4>
                  <ul>
                    <li>Use Save PDF for a clean, bilingual download.</li>
                    <li>Send directly to chat for live guidance follow-ups.</li>
                    <li>Everything on this panel is ready for family-friendly reading.</li>
                  </ul>
                </aside>
              </div>
            </div>
            ) : (
              <div className="reading-placeholder">
                <h3>Space reserved for the live reading</h3>
                <p className="muted">Submit your four details and this area will fill with a clear, shareable interpretation.</p>
                <ul>
                  <li>We wait to render anything until the narrative is ready.</li>
                  <li>Once ready, download as PDF or continue in chat from here.</li>
                  <li>Bilingual guidance lands side by side for easy reading.</li>
                </ul>
              </div>
            )}
        </div>
      </div>
    </section>
  );
}
