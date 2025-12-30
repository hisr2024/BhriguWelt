"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

const steps = [
  {
    title: "Discover your engines",
    description: "Search by intent or category to find the right engine in seconds.",
  },
  {
    title: "Complete guided forms",
    description: "Step-by-step inputs with tooltips ensure every detail is captured correctly.",
  },
  {
    title: "Review interactive insights",
    description: "Explore orbit highlights, zoomable charts, and export-ready reports.",
  },
];

export default function OnboardingTour() {
  const [activeStep, setActiveStep] = useState(0);
  const [open, setOpen] = useState(false);

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      setOpen(false);
      setActiveStep(0);
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  return (
    <section className="rounded-[2.5rem] border border-white/10 bg-slate-950/70 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Onboarding</p>
          <h2 className="text-2xl font-semibold text-white">Start a guided tour of BhriguWelt</h2>
          <p className="max-w-2xl text-sm text-slate-300">
            Move through a curated tutorial that explains where to find engines, how to submit forms, and how to export
            reports.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
        >
          Start tour
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {open ? (
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-indigo-300" />
              <p className="text-sm font-semibold text-white">
                Step {activeStep + 1} of {steps.length}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <h3 className="text-xl font-semibold text-white">{steps[activeStep].title}</h3>
            <p className="text-sm text-slate-300">{steps[activeStep].description}</p>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${
                  index === activeStep
                    ? "border-indigo-400 bg-indigo-500/20 text-white"
                    : "border-white/10 bg-white/5 text-slate-300"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {step.title}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
          >
            {activeStep === steps.length - 1 ? "Finish tour" : "Next step"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
