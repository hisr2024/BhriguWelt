'use client';

import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";

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
    detail: "Share name, date, time, and place with timezone hints and guardrails.",
  },
  {
    title: "Chart",
    detail: "See Śaka conversion, house wheels, and signatures with soft motion.",
  },
  {
    title: "Interpretations",
    detail: "Tap cards for bite-sized readings; expand for deeper context when ready.",
  },
  {
    title: "Horoscopes",
    detail: "Switch between daily, weekly, and Śaka-ready calendar helpers.",
  },
  {
    title: "Past-Life",
    detail: "Walk through karmic arcs and narrative breadcrumbs for lessons learned.",
  },
  {
    title: "Future",
    detail: "Scroll the orbit timeline for dasha, transit, and remedy prompts.",
  },
  {
    title: "Matchmaking",
    detail: "Blend guna scoring with lifestyle filters and ritual suggestions.",
  },
];

const BEGINNER_TIPS = [
  {
    label: "Look for info dots",
    copy: "Tap the ℹ️ dots beside form labels to see a one-line meaning without leaving the screen.",
  },
  {
    label: "Color tells state",
    copy: "Aqua is calm/ready, amber means action needed. The same palette is used across cards and charts.",
  },
  {
    label: "Swipe on mobile",
    copy: "Cards and the timeline respond to left/right swipes so you can move with your thumb.",
  },
];

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [voice, setVoice] = useState(false);
  const [haptics, setHaptics] = useState(false);
  const [beginnerMode, setBeginnerMode] = useState(true);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const seen = typeof window !== "undefined" ? localStorage.getItem("bhrigu-onboarded") : null;
    if (!seen) setOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedBeginner = localStorage.getItem("bhrigu-beginner-mode");
    if (savedBeginner) {
      setBeginnerMode(savedBeginner === "true");
    }
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("bhrigu-beginner-mode", beginnerMode ? "true" : "false");
  }, [beginnerMode]);

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
  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (!touchStart.current) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) {
      return;
    }

    if (deltaX < 0) {
      next();
    } else {
      prev();
    }
  };

  if (!open) return null;

  return (
    <div className="onboard-overlay" role="presentation">
      <div
        className="onboard-modal touch-pan-y"
        role="dialog"
        aria-modal="true"
        aria-label="Bhrigu onboarding journey"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
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
          <div className="beginner-toggle">
            <label className="toggle">
              <input
                type="checkbox"
                checked={beginnerMode}
                onChange={(event) => setBeginnerMode(event.target.checked)}
              />
              <span>Beginner tooltips</span>
            </label>
            <p className="microcopy">
              Keep helper tips pinned to cards, timeline pills, and glossary badges while you explore.
            </p>
          </div>

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

          <div className="beginner-tips" aria-label="Beginner tips list">
            <div className="beginner-tips__heading">
              <p className="eyebrow">Quick tooltips</p>
              <p className="muted">Short notes mirror the helper UI you will see across the app.</p>
            </div>
            <div className="beginner-tips__list" role="list">
              {BEGINNER_TIPS.map((tip) => (
                <div
                  key={tip.label}
                  className={`beginner-tip ${beginnerMode ? "is-active" : "is-muted"}`}
                  role="note"
                >
                  <p className="badge">{tip.label}</p>
                  <p className="muted">{tip.copy}</p>
                </div>
              ))}
            </div>
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
