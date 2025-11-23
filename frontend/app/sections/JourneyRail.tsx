'use client';

import { useEffect, useMemo, useState } from "react";

import { rhythmTracks } from "./sectionData";

type JourneyStep = {
  id: string;
  title: string;
  summary: string;
  prompt: string;
};

const journeySteps: JourneyStep[] = [
  { id: "birth", title: "Birth intake", summary: "Date, time, place, timezone", prompt: "Auto-detect timezone and map pin to lock accuracy." },
  { id: "chart", title: "Chart wheels", summary: "12-house render", prompt: "Micro-animations glow as each house fills." },
  { id: "interpret", title: "Interpretations", summary: "Beginner ↔ advanced", prompt: "Simplified mode trims jargon; glossary expands on tap." },
  { id: "horoscope", title: "Horoscopes", summary: "Daily & ritual cues", prompt: "Voice guidance can read the ritual in Hindi or English." },
  { id: "past-life", title: "Past-life threads", summary: "Karmic echoes", prompt: "Soft prompts avoid sensationalism, nudge reflection." },
  { id: "future", title: "Future dashboards", summary: "Timelines + remedies", prompt: "Swipe gestures step through dasha, transit, remedy rails." },
  { id: "relationships", title: "Relationships", summary: "Matchmaking lens", prompt: "Haptics note compatibility peaks and caution windows." },
];

const constellationNodes = [
  { name: "Orion", tone: "Courage beam", detail: "Guides career pivots with assertive but calm starts." },
  { name: "Lyra", tone: "Harmony chord", detail: "Pairs with horoscopes to soften relationship readings." },
  { name: "Cassiopeia", tone: "Reflective arc", detail: "Past-life prompts echo here with gentle storytelling." },
  { name: "Ursa Minor", tone: "North star", detail: "Future dashboards anchor to this steady marker." },
];

export function JourneyRail() {
  const [activeStep, setActiveStep] = useState(0);
  const [fontScale, setFontScale] = useState(1);
  const [voiceGuidance, setVoiceGuidance] = useState(false);
  const [gestureMode, setGestureMode] = useState(false);
  const [simplifiedMode, setSimplifiedMode] = useState(false);
  const [soundscape, setSoundscape] = useState(rhythmTracks[0]?.title ?? "");
  const [haptics, setHaptics] = useState(false);
  const [animations, setAnimations] = useState(true);

  const progress = Math.round(((activeStep + 1) / journeySteps.length) * 100);
  const currentStep = journeySteps[activeStep];

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", fontScale.toString());
    document.body.dataset.gestures = gestureMode ? "on" : "off";
    document.body.dataset.sound = soundscape ? "on" : "off";
    document.body.dataset.haptics = haptics ? "on" : "off";
    document.body.dataset.animations = animations ? "on" : "off";
  }, [fontScale, gestureMode, soundscape, haptics, animations]);

  const supportivePrompt = useMemo(() => {
    if (!currentStep) return "";
    if (currentStep.id === "birth") {
      return "Timezone auto-detection and map pinning prevent wrong charts; prompts stay kind if fields are missing.";
    }
    if (currentStep.id === "chart") {
      return "If rendering stalls, the system suggests turning on simplified mode and re-running with cached inputs.";
    }
    if (currentStep.id === "future") {
      return "Future dashboards show friendly fallback text if remedies cannot load, with retry links and offline notes.";
    }
    return currentStep.prompt;
  }, [currentStep]);

  return (
    <section className="journey-rail" aria-label="Guided Jyotish journey with accessibility controls">
      <div className="section-heading">
        <p className="eyebrow">Story-like flow</p>
        <h2>Birth → chart → interpretations → horoscopes → past-life → future → relationships</h2>
        <p className="muted">Gentle animations, tooltips, voice guidance, and glossary entries keep new users confident.</p>
      </div>

      <div className="journey-rail__controls" role="group" aria-label="Accessibility and immersion controls">
        <label className="assistive-toggle">
          <span>Font size</span>
          <input
            type="range"
            min={0.94}
            max={1.2}
            step={0.02}
            value={fontScale}
            onChange={(event) => setFontScale(Number(event.target.value))}
            aria-label="Adjust font size"
          />
          <span className="assistive-value">{Math.round(fontScale * 100)}%</span>
        </label>
        <button
          type="button"
          className={`assistive-chip ${voiceGuidance ? "assistive-chip--active" : ""}`}
          onClick={() => setVoiceGuidance((prev) => !prev)}
          aria-pressed={voiceGuidance}
        >
          {voiceGuidance ? "Voice guidance on" : "Enable voice guidance"}
        </button>
        <button
          type="button"
          className={`assistive-chip ${gestureMode ? "assistive-chip--active" : ""}`}
          onClick={() => setGestureMode((prev) => !prev)}
          aria-pressed={gestureMode}
        >
          {gestureMode ? "Gesture hints on" : "Gesture-friendly"}
        </button>
        <button
          type="button"
          className={`assistive-chip ${simplifiedMode ? "assistive-chip--active" : ""}`}
          onClick={() => setSimplifiedMode((prev) => !prev)}
          aria-pressed={simplifiedMode}
        >
          {simplifiedMode ? "Simplified mode active" : "Toggle simplified mode"}
        </button>
        <button
          type="button"
          className={`assistive-chip ${haptics ? "assistive-chip--active" : ""}`}
          onClick={() => setHaptics((prev) => !prev)}
          aria-pressed={haptics}
        >
          {haptics ? "Haptics ready" : "Turn on haptic feedback"}
        </button>
        <button
          type="button"
          className={`assistive-chip ${animations ? "assistive-chip--active" : ""}`}
          onClick={() => setAnimations((prev) => !prev)}
          aria-pressed={animations}
        >
          {animations ? "Micro-animations on" : "Micro-animations muted"}
        </button>
      </div>

      <div className="journey-rail__progress" aria-label={`Progress ${progress}%`}>
        <div className="journey-rail__progress-bar" style={{ width: `${progress}%` }} />
        <p className="microcopy">Step {activeStep + 1} of {journeySteps.length}: {currentStep?.title}</p>
      </div>

      <div className="journey-rail__steps" role="list">
        {journeySteps.map((step, index) => {
          const isCurrent = index === activeStep;
          const isComplete = index < activeStep;
          return (
            <details className="journey-rail__step" key={step.id} open={isCurrent} aria-current={isCurrent} role="listitem">
              <summary>
                <span className="pill">{index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p className="microcopy">{step.summary}</p>
                </div>
                {isComplete ? <span className="badge">Done</span> : null}
              </summary>
              <p className="muted">{step.prompt}</p>
              {isCurrent ? (
                <div className="journey-rail__actions">
                  <p className="microcopy" role="status">{supportivePrompt}</p>
                  <div className="journey-rail__action-row">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                      disabled={activeStep === 0}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => setActiveStep((prev) => Math.min(journeySteps.length - 1, prev + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </details>
          );
        })}
      </div>

      <div className="journey-rail__grid">
        <div className="soundscape-card">
          <div className="soundscape-card__header">
            <div>
              <p className="eyebrow">Cosmic soundscapes</p>
              <h4>Pick an ambience</h4>
              <p className="microcopy">Audio gently cues progression; muting keeps text focus.</p>
            </div>
            <span className="pill">{soundscape ? "Sound on" : "Muted"}</span>
          </div>
          <div className="soundscape-list" role="list">
            {rhythmTracks.map((track) => (
              <label key={track.title} className={`soundscape-tile ${soundscape === track.title ? "soundscape-tile--active" : ""}`}>
                <div>
                  <strong>{track.title}</strong>
                  <p className="microcopy">{track.description}</p>
                </div>
                <input
                  type="radio"
                  name="soundscape"
                  value={track.title}
                  checked={soundscape === track.title}
                  onChange={() => setSoundscape(track.title)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="constellation-card" aria-label="Interactive constellations">
          <div className="constellation-card__header">
            <div>
              <p className="eyebrow">Micro-animations</p>
              <h4>Interactive constellations</h4>
              <p className="microcopy">Tap to reveal how each cluster guides the next step in the wizard.</p>
            </div>
            <span className="pill">Immersive</span>
          </div>
          <div className="constellation-grid" role="list">
            {constellationNodes.map((node) => (
              <details key={node.name} className="constellation-node" role="listitem">
                <summary>
                  <span className="constellation-dot" aria-hidden />
                  <div>
                    <strong>{node.name}</strong>
                    <p className="microcopy">{node.tone}</p>
                  </div>
                </summary>
                <p className="muted">{node.detail}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
