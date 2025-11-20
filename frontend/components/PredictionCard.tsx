'use client';

import React, { useEffect, useRef } from "react";
import { getCopy, type Locale } from "@/lib/i18n";

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
  const sectionRef = useRef<HTMLElement | null>(null);
  const copy = getCopy(process.env.NEXT_PUBLIC_LOCALE as Locale | undefined);

  useEffect(() => {
    if (payload && sectionRef.current) {
      sectionRef.current.focus();
    }
  }, [payload]);

  if (!payload) {
    return (
      <section className="results card" aria-live="polite" ref={sectionRef} tabIndex={-1}>
        <div className="section-heading">
          <p className="eyebrow">Response</p>
          <h3>{title}</h3>
          <p className="muted">{copy.accessibility.responseIntro}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="results card" aria-live="polite" ref={sectionRef} tabIndex={-1}>
      <div className="section-heading">
        <p className="eyebrow">Response</p>
        <h3>{title}</h3>
        <p className="muted">{copy.accessibility.responseReady}</p>
      </div>
      {renderValue(payload)}
    </section>
  );
}
