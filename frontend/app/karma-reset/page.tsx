"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";

type RepairOption = "apology" | "clarification" | "follow-up";

type ResetPlan = {
  id: number;
  grounding: string;
  rippleSummary: string;
  repairStep: string;
  intention: string;
  summaryLines: string[];
};

type ResetInputs = {
  scenario: string;
  ripple: string;
  repair: RepairOption;
};

const MAX_LINE_LENGTH = 118;
const TOTAL_BREATHS = 4;

const groundingPrompts = [
  "Take one slow breath before responding.",
  "Your body is settling — you are okay.",
  "Let one calm inhale soften your shoulders.",
  "Pause for a steady breath; you are safe.",
];

const intentionPrompts = [
  "Show up with patience in your next interaction.",
  "Lead with clarity and kindness.",
  "Move with a gentle tone in the next exchange.",
  "Return with warmth and steady presence.",
];

const repairLibrary: Record<RepairOption, { label: string; step: string; summary: string }> = {
  apology: {
    label: "Apology",
    step: "Acknowledge the moment and apologize briefly with honesty.",
    summary: "Repair: brief, honest apology.",
  },
  clarification: {
    label: "Clarification",
    step: "Clarify your intention gently so they feel understood.",
    summary: "Repair: soft clarification to be understood.",
  },
  "follow-up": {
    label: "Calm follow-up",
    step: "Send a warm follow-up note to re-center the conversation.",
    summary: "Repair: warm follow-up to steady the tone.",
  },
};

function clampLine(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  if (clean.length <= MAX_LINE_LENGTH) return clean;
  return `${clean.slice(0, MAX_LINE_LENGTH - 1)}…`;
}

function sentence(text: string) {
  const trimmed = clampLine(text);
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function buildRippleLine(inputs: ResetInputs) {
  const happened = clampLine(inputs.scenario);
  const feltBy = clampLine(inputs.ripple || "someone close");
  const parts = [
    happened ? `You noted: ${happened}` : "You slowed down to notice what unfolded",
    feltBy ? `${feltBy} felt the ripple` : "Someone felt the ripple",
  ];

  return clampLine(parts.map(sentence).slice(0, 2).join(" "));
}

function buildPlan(inputs: ResetInputs): ResetPlan {
  const grounding = groundingPrompts[Math.floor(Math.random() * groundingPrompts.length)];
  const rippleSummary = buildRippleLine(inputs);
  const repair = repairLibrary[inputs.repair];
  const intention = intentionPrompts[Math.floor(Math.random() * intentionPrompts.length)];

  const summaryLines = [
    clampLine(`Ripple: ${inputs.scenario || "Noted a tense moment"}`),
    clampLine(`Impact: ${inputs.ripple || "A teammate felt the shift"}.`),
    clampLine(repair.summary),
    clampLine(`Intention: ${intention}`),
  ].filter(Boolean);

  return {
    id: Date.now(),
    grounding,
    rippleSummary,
    repairStep: repair.step,
    intention,
    summaryLines,
  };
}

function getProgressLabel(isRunning: boolean, breathCount: number) {
  if (isRunning) {
    return `Breath ${Math.min(breathCount + 1, TOTAL_BREATHS)} of ${TOTAL_BREATHS}`;
  }

  if (breathCount >= TOTAL_BREATHS) return "Breathing cycle complete";
  if (breathCount > 0) return "Paused";
  return "Ready";
}

export default function KarmaResetPage() {
  const [scenario, setScenario] = useState("");
  const [ripple, setRipple] = useState("");
  const [repair, setRepair] = useState<RepairOption>("apology");
  const [pendingPlan, setPendingPlan] = useState<ResetPlan | null>(null);
  const [plan, setPlan] = useState<ResetPlan | null>(null);
  const [breathCount, setBreathCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [revealedCards, setRevealedCards] = useState(0);

  const planReady = Boolean(plan);
  const progressLabel = useMemo(
    () => getProgressLabel(isRunning, breathCount),
    [breathCount, isRunning],
  );

  useEffect(() => {
    if (!plan) return undefined;

    setRevealedCards(0);
    const timers = [0, 160, 320, 480].map((delay, index) =>
      setTimeout(() => setRevealedCards(index + 1), delay),
    );

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [plan]);

  useEffect(() => {
    if (!isRunning || !pendingPlan) return undefined;

    const interval = setInterval(() => {
      setBreathCount((count) => {
        const next = Math.min(count + 1, TOTAL_BREATHS);

        if (next >= TOTAL_BREATHS) {
          clearInterval(interval);
          setIsRunning(false);
          setPlan(pendingPlan);
          setPendingPlan(null);
        }

        return next;
      });
    }, 1300);

    return () => clearInterval(interval);
  }, [isRunning, pendingPlan]);

  const handleBegin = (event: FormEvent) => {
    event.preventDefault();
    if (!scenario.trim() || !ripple.trim()) return;

    setPlan(null);
    setRevealedCards(0);
    setBreathCount(0);
    setPendingPlan(buildPlan({ scenario, ripple, repair }));
    setIsRunning(true);
  };

  const resetDisabled = !scenario.trim() || !ripple.trim() || isRunning;

  return (
    <div className="stack reset-shell">
      <div className="hero">
        <p className="eyebrow">Karma reset ritual</p>
        <h1>Short, calming repair steps with KIAAN.</h1>
        <p className="muted" style={{ maxWidth: "720px" }}>
          Begin a 4-breath reset. KIAAN fills the four cards with concise, compassionate actions—no side panels, no long outputs.
        </p>
        <div className="hero-actions">
          <Link href="/" className="button-link" style={{ background: "rgba(255,255,255,0.08)" }}>
            Back to studio hub
          </Link>
        </div>
      </div>

      <section className="panel softly" aria-label="Reset intake">
        <div className="reset-grid__intake">
          <form className="reset-form" onSubmit={handleBegin}>
            <div className="section-heading">
              <p className="eyebrow">Unified flow</p>
              <h2>What needs repair?</h2>
              <p className="muted">Fill the essentials, press Begin Reset, and let the four cards guide the ritual.</p>
            </div>
            <div className="form-grid">
              <label>
                <span className="microcopy">What happened?</span>
                <textarea
                  required
                  value={scenario}
                  onChange={(event) => setScenario(event.target.value)}
                  placeholder="Briefly note the moment."
                  maxLength={320}
                />
              </label>
              <label>
                <span className="microcopy">Who felt the ripple?</span>
                <input
                  required
                  value={ripple}
                  onChange={(event) => setRipple(event.target.value)}
                  placeholder="Name or role"
                  maxLength={120}
                />
              </label>
              <label>
                <span className="microcopy">Repair selection</span>
                <div className="chip-group" role="group" aria-label="Repair selection">
                  {(Object.keys(repairLibrary) as RepairOption[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`chip ${repair === option ? "chip--active" : ""}`}
                      onClick={() => setRepair(option)}
                      aria-pressed={repair === option}
                    >
                      {repairLibrary[option].label}
                    </button>
                  ))}
                </div>
              </label>
            </div>
            <div className="reset-actions">
              <button type="submit" className="button-link" disabled={resetDisabled}>
                Begin Reset
              </button>
              <p className="microcopy" aria-live="polite">
                Breathing cycle: 4 gentle breaths. Cards expand automatically with KIAAN&apos;s plan.
              </p>
            </div>
          </form>
          <div className="reset-breath" aria-live="polite">
            <div className="reset-breath__header">
              <p className="pill">Breathing animation</p>
              <span className="microcopy">{progressLabel}</span>
            </div>
            <div className="reset-breath__meter" role="status" aria-label="Breathing progress">
              {Array.from({ length: TOTAL_BREATHS }).map((_, index) => {
                const isActive = index < breathCount || (isRunning && index === breathCount);
                return <span key={index} className={`reset-breath__dot ${isActive ? "reset-breath__dot--active" : ""}`} />;
              })}
            </div>
            <p className="muted">Four slow breaths anchor the ritual; outputs land inside the cards the moment the cycle ends.</p>
          </div>
        </div>
      </section>

      <section className="panel softly" aria-label="Reset cards">
        <div className="section-heading">
          <p className="eyebrow">Guided cards</p>
          <h2>All outputs stay inside these four steps</h2>
          <p className="muted">No side panels or long blocks—each card holds a short, warm directive from KIAAN.</p>
        </div>
        <div className="reset-grid" role="list">
          <article className={`reset-card reset-card--warm ${revealedCards >= 1 ? "reset-card--active" : ""}`} role="listitem">
            <div className="reset-card__header">
              <div>
                <p className="pill">Card 1 — Pause &amp; Breathe</p>
                <h3>Ground first</h3>
              </div>
              <span className="badge">Auto-filled</span>
            </div>
            <p className="muted">System inserts a grounding line; user input is not required.</p>
            <p className="reset-card__output" aria-live="polite">
              {planReady ? plan?.grounding : "KIAAN will place a gentle breath cue here."}
            </p>
          </article>

          <article className={`reset-card reset-card--violet ${revealedCards >= 2 ? "reset-card--active" : ""}`} role="listitem">
            <div className="reset-card__header">
              <div>
                <p className="pill">Card 2 — Name the Ripple</p>
                <h3>Capture the moment</h3>
              </div>
              <span className="badge">Auto-filled</span>
            </div>
            <p className="muted">KIAAN summarizes what happened and who felt it in 1–2 short sentences.</p>
            <p className="reset-card__output" aria-live="polite">
              {planReady ? plan?.rippleSummary : "Once ready, KIAAN will log the ripple here."}
            </p>
          </article>

          <article className={`reset-card reset-card--green ${revealedCards >= 3 ? "reset-card--active" : ""}`} role="listitem">
            <div className="reset-card__header">
              <div>
                <p className="pill">Card 3 — Choose the Repair</p>
                <h3>Deliver the repair</h3>
              </div>
              <span className="badge">Auto-filled</span>
            </div>
            <p className="muted">Based on your selection, KIAAN drops a single, clear repair step.</p>
            <p className="reset-card__output" aria-live="polite">
              {planReady ? plan?.repairStep : "KIAAN will place the chosen repair instruction."}
            </p>
          </article>

          <article className={`reset-card reset-card--blue ${revealedCards >= 4 ? "reset-card--active" : ""}`} role="listitem">
            <div className="reset-card__header">
              <div>
                <p className="pill">Card 4 — Move with Intention</p>
                <h3>Step forward</h3>
              </div>
              <span className="badge">Auto-filled</span>
            </div>
            <p className="muted">KIAAN sets one calm intention that looks ahead.</p>
            <p className="reset-card__output" aria-live="polite">
              {planReady ? plan?.intention : "The forward-looking intention lands here."}
            </p>
          </article>
        </div>

        {planReady && (
          <div className="reset-summary" aria-live="polite">
            <p className="pill">Optional summary</p>
            <h3>4-line recap</h3>
            <div className="reset-summary__lines">
              {plan?.summaryLines.slice(0, 4).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
