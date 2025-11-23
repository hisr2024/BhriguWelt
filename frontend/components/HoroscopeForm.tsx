'use client';

import { FormEvent, useMemo, useState } from "react";

type FormState = {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
};

type ChartResponse = Record<string, unknown>;

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const isComplete = useMemo(() => Object.values(form).every(Boolean), [form]);
  const formattedChart = useMemo(() => (chart ? JSON.stringify(chart, null, 2) : ""), [chart]);

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
    setLoading(true);

    const attempt = async (path: string) => {
      const data = await postChart(path, form);
      setEndpoint(path);
      setChart(data);
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

    const safeChart = sanitize(formattedChart);
    printable.document.write(`
      <html>
        <head>
          <title>Holistic Horoscope</title>
          <style>
            body { font-family: "Inter", system-ui, -apple-system, sans-serif; background: #0b1021; color: #e8edff; margin: 0; padding: 32px; }
            h1 { margin-top: 0; letter-spacing: 0.02em; }
            .meta { color: #cbd5f5; margin-bottom: 24px; }
            pre { white-space: pre-wrap; word-break: break-word; background: #0f1628; border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; padding: 16px; color: #dbeafe; }
          </style>
        </head>
        <body>
          <h1>Holistic Horoscope</h1>
          <p class="meta">Generated from name, date of birth, time of birth, and place of birth.</p>
          <pre>${safeChart}</pre>
        </body>
      </html>
    `);
    printable.document.close();
    printable.focus();
    printable.print();
  };

  return (
    <section className="horoscope-intake" aria-label="Horoscope intake">
      <div className="holo-grid">
        <div className="holo-copy">
          <p className="eyebrow">Holistic Bhrigu flow</p>
          <h2>Keep the four pillars ready</h2>
          <p className="muted">
            Name, date of birth, time of birth, and place of birth stay visible at every step so the reading never loses the
            seeker. The layout opens wide for interpretations while keeping controls lightweight.
          </p>
          <div className="flow-grid" role="list">
            <div className="flow-card" role="listitem">
              <p className="pill">Input</p>
              <h3>Identify the seeker</h3>
              <p className="muted">Capture the core birth details without secondary toggles or extra context.</p>
            </div>
            <div className="flow-card" role="listitem">
              <p className="pill">Interpret</p>
              <h3>Holistic horoscope</h3>
              <p className="muted">Receive a clean English and Hindi interpretation on a spacious reading canvas.</p>
            </div>
            <div className="flow-card" role="listitem">
              <p className="pill">Deliver</p>
              <h3>Downloadable PDF</h3>
              <p className="muted">Print or save the reading instantly—no engine jargon or delivery steps required.</p>
            </div>
          </div>
        </div>

        <div className="holo-panel">
          <form className="holo-form" onSubmit={handleSubmit} aria-busy={loading}>
            <div className="holo-field">
              <label htmlFor="horoscope-name">Name</label>
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
            </div>

            <div className="holo-inline">
              <div className="holo-field">
                <label htmlFor="horoscope-dob">Date of Birth</label>
                <input
                  id="horoscope-dob"
                  name="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
                  required
                />
              </div>
              <div className="holo-field">
                <label htmlFor="horoscope-tob">Time of Birth</label>
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

            <div className="holo-field">
              <label htmlFor="horoscope-pob">Place of Birth</label>
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
              <p className="microcopy">Autocomplete-ready lane. Keep it simple today; plug in your city or town.</p>
            </div>

            <div className="holo-actions">
              <button type="submit" disabled={loading || !isComplete} aria-label="Generate natal chart">
                {loading ? "Consulting Bhrigu..." : "Generate chart"}
              </button>
              <span className="badge" aria-live="polite">
                {status === "success" ? "Reading space ready" : "Only the four essentials are needed"}
              </span>
            </div>

            {error ? (
              <div className="error-banner" role="alert">
                {error}
                <p className="microcopy" style={{ marginTop: "0.25rem" }}>
                  Confirm the four primary inputs and try again. Connectivity hiccups reset automatically.
                </p>
              </div>
            ) : null}

            {status === "success" ? (
              <div className="success-banner" role="status">
                <div className="success-header">
                  <div>
                    <p className="eyebrow">Chart stored</p>
                    <strong>{endpoint ?? "Local synthesis"}</strong>
                  </div>
                  <div className="canvas-actions">
                    <button type="button" className="ghost-button" onClick={handleAskBhrigu}>
                      Ask Bhrigu
                    </button>
                    <button type="button" className="ghost-button" onClick={handleDownloadPdf}>
                      Download PDF
                    </button>
                  </div>
                </div>
                <p className="microcopy">Reading saved to the page. Share via chat or save the interpretation as a PDF.</p>
              </div>
            ) : null}
          </form>

          {chart ? (
            <div className="interpretation-grid" aria-live="polite">
              <div className="interpretation-canvas">
                <div className="canvas-head">
                  <div>
                    <p className="eyebrow">Holistic interpretation</p>
                    <h3 className="canvas-title">Wide reading space</h3>
                  </div>
                  <div className="canvas-actions">
                    <button type="button" className="ghost-button" onClick={handleDownloadPdf}>
                      Save as PDF
                    </button>
                  </div>
                </div>
                <p className="muted">English and Hindi guidance is displayed with comfortable line height for long-form reading.</p>
                <pre>{formattedChart}</pre>
              </div>

              <div className="interpretation-notes">
                <h4>Core highlights</h4>
                <ul>
                  <li>Clean text blocks keep each insight readable on wide screens.</li>
                  <li>Use the PDF action to store the interpretation in your downloads folder.</li>
                  <li>Primary inputs remain visible above for quick edits without leaving the canvas.</li>
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
