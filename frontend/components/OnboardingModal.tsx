'use client';

import { useEffect, useMemo, useState } from "react";

const GLOSSARY = [
  {
    term: "Tithi",
    description: "Lunar day marker—guides rituals and emotional tides.",
    note: "Shown next to your moon data on forms so beginners never guess.",
  },
  {
    term: "Nakshatra",
    description: "Star field a planet occupies—anchors tone and remedies.",
    note: "We surface this beside house interpretations in the wheel.",
  },
  {
    term: "Bhava",
    description: "The house container—reveals life themes and duties.",
    note: "Tap any house card to expand and see this definition inline.",
  },
];

const JOURNEY_STEPS = [
  {
    title: "Birth input",
    detail: "Share name, date, time, and place. We pre-check formats and timezones.",
  },
  {
    title: "Chart generation",
    detail: "See Śaka conversion, house wheel, and signatures with soft motion.",
  },
  {
    title: "Interpretations",
    detail: "Tap cards for bite-sized readings; expand for deeper context when ready.",
  },
  {
    title: "Timelines & remedies",
    detail: "Scroll the orbit timeline for dasha, transit, and remedy prompts.",
  },
];

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [voice, setVoice] = useState(false);
  const [haptics, setHaptics] = useState(false);

  useEffect(() => {
    const seen = typeof window !== "undefined" ? localStorage.getItem("bhrigu-onboarded") : null;
    if (!seen) setOpen(true);
  }, []);

  useEffect(() => {
    if (!open || !voice) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(
      `${JOURNEY_STEPS[step].title}. ${JOURNEY_STEPS[step].detail}`,
    );
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [open, step, voice]);

  const progressPercent = useMemo(() => Math.round(((step + 1) / JOURNEY_STEPS.length) * 100), [step]);

  const closeModal = () => {
    setOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("bhrigu-onboarded", "true");
    }
  };

  const next = () => {
    setStep((prev) => Math.min(prev + 1, JOURNEY_STEPS.length - 1));
    if (haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(20);
    }
  };

  const prev = () => setStep((prev) => Math.max(prev - 1, 0));

  if (!open) return null;

  return (
    <div className="onboard-overlay" role="presentation">
      <div
        className="onboard-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Bhrigu onboarding journey"
      >
        <header className="onboard-header">
          <div>
            <p className="eyebrow">Welcome</p>
            <h3>Guided tour for first-time seekers</h3>
            <p className="muted">Modern visuals, tooltips, and glossary keep the Jyotish flow human and calm.</p>
          </div>
          <button type="button" className="ghost-button" onClick={closeModal} aria-label="Close onboarding">
            Skip
          </button>
        </header>

        <div className="onboard-body">
          <div className="journey-steps" aria-live="polite">
            {JOURNEY_STEPS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                className={`journey-step ${index === step ? "is-active" : ""}`}
                onClick={() => setStep(index)}
                aria-current={index === step}
              >
                <span className="pill">{index + 1}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p className="muted">{item.detail}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="glossary">
            <div className="glossary__heading">
              <p className="eyebrow">Glossary</p>
              <p className="muted">Tap an unfamiliar term. Tooltips mirror the UI labels.</p>
            </div>
            <div className="glossary__list" role="list">
              {GLOSSARY.map((item) => (
                <details key={item.term} role="listitem" className="glossary__item">
                  <summary>
                    <span className="badge">{item.term}</span>
                    <span className="muted">Show meaning</span>
                  </summary>
                  <p>{item.description}</p>
                  <p className="microcopy">{item.note}</p>
                </details>
              ))}
            </div>
          </div>
        </div>

        <div className="onboard-footer">
          <div className="onboard-controls" aria-label="Accessibility controls">
            <label className="toggle">
              <input
                type="checkbox"
                checked={voice}
                onChange={(event) => setVoice(event.target.checked)}
              />
              <span>Voice guidance</span>
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={haptics}
                onChange={(event) => setHaptics(event.target.checked)}
              />
              <span>Haptic nudges</span>
            </label>
          </div>
          <div className="progress" aria-label="Onboarding progress">
            <div className="progress__bar" style={{ width: `${progressPercent}%` }} />
            <span className="progress__label">{progressPercent}% ready</span>
          </div>
          <div className="onboard-actions">
            <button type="button" className="ghost-button" onClick={prev} disabled={step === 0}>
              Back
            </button>
            <button type="button" className="button-link" onClick={step === JOURNEY_STEPS.length - 1 ? closeModal : next}>
              {step === JOURNEY_STEPS.length - 1 ? "Start exploring" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
