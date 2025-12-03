'use client';

import { useState } from "react";

import { TriangleEnergySystem } from "@/components/branding/TriangleEnergySystem";

export function TriangleEnergySection() {
  const [active, setActive] = useState<string>("inner-peace");

  return (
    <section className="panel softly" id="triangle-energy">
      <div className="section-heading">
        <p className="eyebrow">Triangle Flow</p>
        <h2>Inner Peace · Mind Control · Self Kindness</h2>
        <p className="muted">
          A glowing equilateral circuit keeps each anchor alive with breath-like rings, focused pulses, and heart-forward blooms.
          Hover to redirect energy or tap to feel the resonance shift.
        </p>
      </div>
      <TriangleEnergySystem active={active} onChange={(id) => setActive(id)} />
      <p className="microcopy" aria-live="polite">
        {active === "inner-peace"
          ? "Inner Peace is pulsing with slow inhale-exhale rings."
          : active === "mind-control"
            ? "Mind Control channels a linear pulse along the nearest edge."
            : "Self Kindness is radiating a soft bloom that warms the triangle."}
      </p>
    </section>
  );
}
