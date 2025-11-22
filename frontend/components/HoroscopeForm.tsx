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

  return (
    <section className="horoscope-intake" aria-label="Horoscope intake">
      <div className="holo-grid">
        <div className="holo-copy">
          <p className="eyebrow">Minimal cosmic intake</p>
          <h2>Horoscope form tuned for calm focus</h2>
          <p className="muted">
            Name, birth date, birth time, and place. Clean lines, lots of whitespace, and a gentle Bharat-first gradient that
            frames the inputs without crowding them.
          </p>
          <ul className="pill-list">
            <li className="pill">Śaka-aware</li>
            <li className="pill">Whisper gradients</li>
            <li className="pill">WCAG focus rings</li>
          </ul>
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
                {status === "success" ? "Chart cached for chat" : "We only need these four details"}
              </span>
            </div>

            {error ? (
              <div className="error-banner" role="alert">
                {error}
                <p className="microcopy" style={{ marginTop: "0.25rem" }}>
                  Tried /api/chart then /api/bhrigu-chat. Check the backend URL or try again.
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
                  <button type="button" className="ghost-button" onClick={handleAskBhrigu}>
                    Ask Bhrigu
                  </button>
                </div>
                <p className="microcopy">Lightweight confirmation. Hand off to the chat rail without breaking focus.</p>
              </div>
            ) : null}
          </form>

          {chart ? (
            <div className="holo-preview" aria-live="polite">
              <div className="preview-header">
                <p className="eyebrow">Chart snapshot</p>
                <span className="pill">Minimal JSON</span>
              </div>
              <pre>{JSON.stringify(chart, null, 2)}</pre>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
