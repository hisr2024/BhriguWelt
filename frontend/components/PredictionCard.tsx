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
    return null;
  }

  return (
    <section className="results" aria-live="polite">
      <h3>{title}</h3>
      {renderValue(payload)}
    </section>
  );
}
