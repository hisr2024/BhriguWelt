'use client';

import React from "react";

export type ProgressStep = {
  title: string;
  description?: string;
  status: "pending" | "active" | "complete";
};

interface ProgressIndicatorProps {
  steps: ProgressStep[];
  label?: string;
}

export default function ProgressIndicator({ steps, label }: ProgressIndicatorProps) {
  const completed = steps.filter((step) => step.status === "complete").length;
  const percentage = Math.round((completed / Math.max(steps.length, 1)) * 100);

  return (
    <div className="progress-indicator" role="group" aria-label={label || "Progress"}>
      <div className="progress-indicator__bar" aria-hidden="true">
        <div className="progress-indicator__fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="progress-indicator__meta">
        <span className="microcopy">{percentage}% grounded in birth data</span>
      </div>
      <div className="progress-indicator__steps" role="list">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`progress-indicator__step progress-indicator__step--${step.status}`}
            role="listitem"
          >
            <div className="progress-indicator__step-label">
              <span className="pill">{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                {step.description && <p className="microcopy">{step.description}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
