'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { JOURNEY_STEPS } from "./JourneyRail";

export default function WizardProgress() {
  const pathname = usePathname();
  const normalized = useMemo(() => {
    if (!pathname) return "/";
    if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
    return pathname;
  }, [pathname]);

  const activeIndex = useMemo(() => {
    return JOURNEY_STEPS.findIndex((step) => {
      const url = new URL(step.href, "http://placeholder.local");
      return normalized.startsWith(url.pathname);
    });
  }, [normalized]);

  const resolvedIndex = activeIndex === -1 ? 0 : activeIndex;
  const progressPercent = Math.round(((resolvedIndex + 1) / JOURNEY_STEPS.length) * 100);
  const nextStep = JOURNEY_STEPS[Math.min(resolvedIndex + 1, JOURNEY_STEPS.length - 1)];

  return (
    <nav className="wizard-rail" aria-label="Step-by-step wizard">
      <div className="wizard-rail__header">
        <div>
          <p className="eyebrow">Step-by-step wizard</p>
          <h4>Birth → chart → interpretations → horoscopes → past-life → future → matchmaking</h4>
        </div>
        <div className="wizard-rail__progress" aria-live="polite">
          <div className="wizard-rail__progress-bar" style={{ width: `${progressPercent}%` }} />
          <span className="wizard-rail__progress-label">{progressPercent}% complete</span>
        </div>
      </div>
      <ol className="wizard-rail__steps" aria-label="Wizard steps">
        {JOURNEY_STEPS.map((step, index) => {
          const isActive = index === resolvedIndex;
          const isComplete = index < resolvedIndex;
          return (
            <li
              key={step.label}
              className={`wizard-rail__step ${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`.trim()}
            >
              <Link href={step.href} className="wizard-rail__step-link">
                <span className="pill" aria-hidden>
                  {isComplete ? "✓" : index + 1}
                </span>
                <div>
                  <p className="wizard-rail__step-label">{step.label}</p>
                  <p className="microcopy">{step.description}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="wizard-rail__footer" aria-live="polite">
        <p className="microcopy">
          {nextStep?.label === JOURNEY_STEPS[resolvedIndex]?.label
            ? "You are viewing the current milestone."
            : `Up next: ${nextStep?.label}`}
        </p>
        <div className="wizard-rail__actions">
          <Link className="ghost-button" href={nextStep.href}>
            Continue to {nextStep.label}
          </Link>
        </div>
      </div>
    </nav>
  );
}
