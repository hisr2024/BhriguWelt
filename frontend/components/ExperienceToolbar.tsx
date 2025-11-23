'use client';

import { useEffect, useState } from "react";

export default function ExperienceToolbar() {
  const [fontScale, setFontScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [voiceOver, setVoiceOver] = useState(false);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", fontScale.toString());
  }, [fontScale]);

  useEffect(() => {
    document.body.dataset.contrast = highContrast ? "high" : "normal";
  }, [highContrast]);

  useEffect(() => {
    document.body.dataset.voice = voiceOver ? "on" : "off";
  }, [voiceOver]);

  return (
    <section className="experience-toolbar" aria-label="Accessibility and preference toggles">
      <div className="experience-toolbar__controls">
        <label className="toggle">
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(event) => setHighContrast(event.target.checked)}
          />
          <span>High contrast</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={voiceOver}
            onChange={(event) => setVoiceOver(event.target.checked)}
          />
          <span>Voice-over cues</span>
        </label>
        <div className="font-scale" aria-label="Adjust font size">
          <button type="button" onClick={() => setFontScale((value) => Math.max(0.9, value - 0.1))}>
            A-
          </button>
          <span>{Math.round(fontScale * 100)}%</span>
          <button type="button" onClick={() => setFontScale((value) => Math.min(1.2, value + 0.1))}>
            A+
          </button>
        </div>
      </div>
      <p className="muted experience-toolbar__hint">
        Tweaks are live. Larger tap targets, voice-enabled cues, and contrast-friendly colors keep the Jyotish studio usable on mobile.
      </p>
    </section>
  );
}
