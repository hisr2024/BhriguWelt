'use client';

export function JourneyRail() {
  const steps = [
    {
      id: 1,
      title: "Birth input",
      detail: "Auto-Śaka conversion, timezone nudges, map-based place selection.",
      status: "complete",
    },
    {
      id: 2,
      title: "Chart render",
      detail: "Interactive kundli with layered taps for interpretations.",
      status: "active",
    },
    {
      id: 3,
      title: "Interpret",
      detail: "Guided tooltips, glossary, and gentle animation cues.",
      status: "pending",
    },
    {
      id: 4,
      title: "Horoscope",
      detail: "Daily → yearly predictions linked back to the wheel.",
      status: "pending",
    },
    {
      id: 5,
      title: "Past/Future",
      detail: "Narrative cards unlock after the base chart is done.",
      status: "pending",
    },
    {
      id: 6,
      title: "Matchmaking",
      detail: "Duo overlays, shared story arcs, and energy balance badges.",
      status: "pending",
    },
  ];

  const completed = steps.filter((step) => step.status === "complete").length;
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <section className="journey-rail" aria-label="Guided Jyotish journey">
      <div className="section-heading">
        <p className="eyebrow">Story-like flow</p>
        <h2>Birth input → chart → interpretations → timelines</h2>
        <p className="muted">
          Gentle animations, tooltips, and glossary entries keep new users confident. Progress shows exactly where the seeker is
          within the unfolding story.
        </p>
      </div>
      <div className="journey-rail__progress" role="img" aria-label={`Journey ${progress}% complete`}>
        <div className="journey-rail__bar" style={{ width: `${progress}%` }} />
        <p className="microcopy">Wizard-like rail keeps the order: birth → chart → interpretations → predictions → relationships.</p>
      </div>
      <div className="journey-rail__steps">
        {steps.map((step) => (
          <details key={step.id} className={`journey-rail__step journey-rail__step--${step.status}`} open={step.status !== "pending"}>
            <summary>
              <span className="pill">{step.id}</span>
              <div>
                <strong>{step.title}</strong>
                <p className="microcopy">{step.detail}</p>
              </div>
            </summary>
            <p className="muted">
              {step.status === "pending"
                ? "Next up in the guided wizard; prior steps must be acknowledged first."
                : "Step locked in with checkpoints and glossary chips."}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
