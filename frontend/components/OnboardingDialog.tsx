"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const steps = [
  {
    title: "Welcome",
    copy: "Meet the Bhrigu engines that guide your journey across horoscope, future, and matchmaking insights.",
  },
  {
    title: "Glossary",
    copy: "Glossary\nTithi: lunar day in the Vedic calendar.\nNakshatra: lunar mansion guiding temperament.",
  },
  {
    title: "Your ritual",
    copy: "Customize voice guidance, haptic nudges, and language preferences for mobile comfort.",
  },
];

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    setOpen(true);
  }, []);

  if (!open) return null;

  const current = steps[step];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div
        role="dialog"
        aria-label="Onboarding journey"
        className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-950/95 p-6 text-slate-100 shadow-2xl"
      >
        <h2 className="text-xl font-semibold">{current.title}</h2>
        <div className="mt-3 grid gap-3 text-sm text-slate-300">
          <p className="whitespace-pre-line">{current.copy}</p>
          <button
            type="button"
            className="w-fit rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-amber-200 hover:border-amber-300"
            onClick={() => setStep(1)}
          >
            Glossary
          </button>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-amber-400" aria-label="Voice guidance" />
            Voice guidance
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-amber-400" aria-label="Haptic nudges" />
            Haptic nudges
          </label>
        </div>
        <div className="mt-6 flex justify-between gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Skip
          </Button>
          <div className="flex gap-2">
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep((prev) => prev + 1)}>Next</Button>
            ) : (
              <Button onClick={() => setOpen(false)}>Start exploring</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
