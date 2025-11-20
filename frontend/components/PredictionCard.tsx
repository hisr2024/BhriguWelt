'use client';

import React from "react";

interface Props {
  title: string;
  payload: unknown;
}

function renderValue(value: unknown) {
  if (!value) return null;
  if (Array.isArray(value)) {
    return (
      <ul>
        {value.map((entry, index) => (
          <li key={index}>
            <pre>{JSON.stringify(entry, null, 2)}</pre>
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return <pre>{JSON.stringify(value, null, 2)}</pre>;
  }
  return <p>{String(value)}</p>;
}

export default function PredictionCard({ title, payload }: Props) {
  if (!payload) {
    return (
      <section className="results card" aria-live="polite">
        <div className="section-heading">
          <p className="eyebrow">Response</p>
          <h3>{title}</h3>
          <p className="muted">Results will appear here after you submit the form.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="results card" aria-live="polite">
      <div className="section-heading">
        <p className="eyebrow">Response</p>
        <h3>{title}</h3>
        <p className="muted">Raw JSON you can paste into mobile, web, or chat UI layers.</p>
      </div>
      {renderValue(payload)}
    </section>
  );
}
