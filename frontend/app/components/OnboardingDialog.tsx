"use client";

import { useState } from "react";

const steps = [
  {
    title: "Welcome to your onboarding journey",
    description:
      "Gather your birth details and preferences. We'll align your chart, remedies, and future checkpoints.",
  },
  {
    title: "Align the cosmic dashboard",
    description:
      "See horoscopes, matchmaking, and calendars side-by-side. Every flow stays synchronized.",
  },
  {
    title: "Ready to explore",
    description: "Save your preferences and dive into real-time manuscript guidance.",
  },
];

export default function OnboardingDialog() {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(0);
  const [showGlossary, setShowGlossary] = useState(false);

  if (!visible) return null;

  const isLast = step === steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4"
      role="dialog"
      aria-label="Onboarding journey"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-card-gradient p-8 shadow-glow">
        <div className="flex flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-aurora">Onboarding journey</p>
            <h2 className="mt-2 text-3xl font-semibold">{steps[step].title}</h2>
            <p className="mt-3 text-sm text-slate-300">{steps[step].description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <input type="checkbox" className="h-4 w-4" />
              Voice guidance
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <input type="checkbox" className="h-4 w-4" />
              Haptic nudges
            </label>
          </div>

          <button
            type="button"
            className="w-fit rounded-full border border-aurora/40 bg-aurora/10 px-4 py-2 text-xs uppercase tracking-[0.2em]"
            onClick={() => setShowGlossary((prev) => !prev)}
          >
            Glossary
          </button>

          {showGlossary && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200">
              <p className="font-semibold">Tithi</p>
              <p className="text-xs text-slate-300">
                The lunar day used in Vedic calendars to align rituals and auspicious timing.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {!isLast ? (
              <button
                type="button"
                className="rounded-full border border-white/15 px-5 py-2 text-sm"
                onClick={() => setStep((prev) => Math.min(prev + 1, steps.length - 1))}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="rounded-full bg-aurora px-6 py-2 text-sm font-semibold text-slate-900"
                onClick={() => setVisible(false)}
              >
                Start exploring
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
