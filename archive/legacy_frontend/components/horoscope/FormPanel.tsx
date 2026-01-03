import { FormEvent } from "react";

import { FormState } from "./types";

type Props = {
  form: FormState;
  loading: boolean;
  endpoint: string | null;
  error: string | null;
  isComplete: boolean;
  onChange: (field: keyof FormState, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export default function FormPanel({
  form,
  loading,
  endpoint,
  error,
  isComplete,
  onChange,
  onSubmit,
}: Props) {
  return (
    <div className="horo-panel horo-panel--form">
      <div className="panel-head">
        <div>
          <p className="pill">Essentials</p>
          <h2>Input once.</h2>
        </div>
      </div>

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
      </form>
    </div>
  );
}
