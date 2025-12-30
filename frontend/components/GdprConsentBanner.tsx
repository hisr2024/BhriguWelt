"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "bhriguwelt-consent";

type ConsentChoice = "accepted" | "essential";

type StoredConsent = {
  choice: ConsentChoice;
  timestamp: string;
};

const defaultConsent: StoredConsent = {
  choice: "essential",
  timestamp: new Date().toISOString(),
};

export default function GdprConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const persistConsent = (choice: ConsentChoice) => {
    const payload: StoredConsent = {
      ...defaultConsent,
      choice,
      timestamp: new Date().toISOString(),
    };
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <section
      className="fixed bottom-6 right-6 z-50 w-[min(420px,90vw)] space-y-4 rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-sm text-slate-200 shadow-[0_25px_60px_rgba(2,6,23,0.6)] backdrop-blur"
      role="dialog"
      aria-live="polite"
      aria-label="Privacy consent"
    >
      <div className="space-y-2">
        <strong className="text-base text-white">We respect your privacy.</strong>
        <p className="text-slate-300">
          Essential cookies keep sessions steady. Opt into analytics to help refine new readings and experience flows.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white"
          onClick={() => persistConsent("accepted")}
        >
          Accept analytics
        </button>
        <button
          type="button"
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200"
          onClick={() => persistConsent("essential")}
        >
          Essential only
        </button>
      </div>
    </section>
  );
}
