import { FormEvent } from "react";

import { FormState, FormStatus } from "./types";

type ProgressStep = {
  title: string;
  description: string;
  status: "pending" | "active" | "complete";
};

type Props = {
  form: FormState;
  status: FormStatus;
  loading: boolean;
  endpoint: string | null;
  error: string | null;
  isComplete: boolean;
  progressSteps: ProgressStep[];
  prefillNotice?: string | null;
  voiceSupported: boolean;
  isSpeaking: boolean;
  onToggleVoiceGuidance: () => void;
  voiceStatus: string;
  onChange: (field: keyof FormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAskBhrigu: () => void;
  onDownloadPdf: () => void;
};

export default function FormPanel({
  form,
  status,
  loading,
  endpoint,
  error,
  isComplete,
  progressSteps,
  prefillNotice,
  voiceSupported,
  isSpeaking,
  onToggleVoiceGuidance,
  voiceStatus,
  onChange,
  onSubmit,
  onAskBhrigu,
  onDownloadPdf,
}: Props) {
  return (
    <div className="horo-panel horo-panel--form">
      <div className="panel-head">
        <div>
          <p className="pill">Essentials</p>
          <h2>Input once.</h2>
        </div>
        <div className="status-chip" aria-live="polite">
          {status === "success" ? "Reading ready" : "Awaiting details"}
        </div>
      </div>
      <div className="assistive-row" role="group" aria-label="Form guidance controls">
        <button
          type="button"
          className={`assistive-chip ${isSpeaking ? "assistive-chip--active" : ""}`}
          onClick={onToggleVoiceGuidance}
          aria-pressed={isSpeaking}
          aria-describedby={voiceSupported ? undefined : "voice-unsupported"}
          disabled={!voiceSupported}
        >
          {isSpeaking ? "Stop voice guidance" : "Play voice guidance"}
        </button>
        <span className="assistive-value" aria-live="polite">
          {voiceStatus}
        </span>
        {!voiceSupported ? (
          <span id="voice-unsupported" className="microcopy">
            Voice guidance is not supported in this browser.
          </span>
        ) : null}
      </div>

      {prefillNotice ? (
        <div className="inline-banner" role="status">
          <div>
            <strong>Śaka calendar applied</strong>
            <p className="microcopy">{prefillNotice}</p>
          </div>
        </div>
      ) : null}

      <form className="horo-form" onSubmit={onSubmit} aria-busy={loading}>
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
              onChange={(event) => onChange("name", event.target.value)}
              required
            />
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
              onChange={(event) => onChange("dateOfBirth", event.target.value)}
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
              onChange={(event) => onChange("timeOfBirth", event.target.value)}
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
              onChange={(event) => onChange("placeOfBirth", event.target.value)}
              required
            />
          </div>
        </div>

        <div className="field-row field-row--split">
          <div className="field">
            <label htmlFor="horoscope-lunar-tithi">Lunar tithi (1-30)</label>
            <input
              id="horoscope-lunar-tithi"
              name="lunarTithi"
              type="number"
              min={1}
              max={30}
              placeholder="e.g. 12"
              value={form.lunarTithi || ""}
              onChange={(event) => onChange("lunarTithi", event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="horoscope-moon-element">Moon element</label>
            <select
              id="horoscope-moon-element"
              name="moonElement"
              value={form.moonElement || ""}
              onChange={(event) => onChange("moonElement", event.target.value)}
            >
              <option value="">Select element</option>
              <option value="water">Water</option>
              <option value="fire">Fire</option>
              <option value="air">Air</option>
              <option value="earth">Earth</option>
              <option value="ether">Ether</option>
            </select>
          </div>
        </div>

        <div className="action-row">
          <button type="submit" disabled={loading || !isComplete} aria-label="Generate horoscope">
            {loading ? "Preparing your reading..." : "Generate reading"}
          </button>
          <div className="action-notes">{endpoint ? <p className="microcopy">Saved from: {endpoint}</p> : null}</div>
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
            </div>
            <div className="banner-actions">
              <button type="button" className="ghost-button" onClick={onAskBhrigu}>
                Ask in chat
              </button>
              <button type="button" className="ghost-button" onClick={onDownloadPdf}>
                Download PDF
              </button>
            </div>
          </div>
        ) : null}

        <div className="progress-rail" aria-label="Horoscope generation progress">
          {progressSteps.map((step) => (
            <div key={step.title} className={`progress-step progress-step--${step.status}`}>
              <div className="progress-step__head">
                <span className="pill">{step.status === "complete" ? "Done" : step.status === "active" ? "Now" : "Next"}</span>
                <strong>{step.title}</strong>
              </div>
              <p className="microcopy">{step.description}</p>
              <div className="progress-meter" role="img" aria-label={`${step.title} ${step.status}`}>
                <span
                  className="progress-meter__bar"
                  style={{ width: step.status === "complete" ? "100%" : step.status === "active" ? "65%" : "25%" }}
                />
              </div>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}
