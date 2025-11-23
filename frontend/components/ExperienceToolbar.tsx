'use client';

import { useCallback, useEffect, useMemo, useState } from "react";

export default function ExperienceToolbar() {
  const [fontScale, setFontScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [voiceOver, setVoiceOver] = useState(false);
  const speechSupported = useMemo(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    [],
  );

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", fontScale.toString());
  }, [fontScale]);

  useEffect(() => {
    document.body.dataset.contrast = highContrast ? "high" : "normal";
  }, [highContrast]);

  useEffect(() => {
    document.body.dataset.voice = voiceOver ? "on" : "off";
  }, [voiceOver]);

  useEffect(() => {
    if (!speechSupported) return undefined;
    return () => window.speechSynthesis.cancel();
  }, [speechSupported]);

  const speak = useCallback(
    (message: string) => {
      if (!voiceOver || !speechSupported) return;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.96;
      utterance.pitch = 1.02;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [speechSupported, voiceOver],
  );

  useEffect(() => {
    if (!voiceOver) {
      if (speechSupported) window.speechSynthesis.cancel();
      return;
    }
    speak("Voice guidance on. Use the slider or buttons to tune font size. High contrast boosts legibility.");
  }, [speak, speechSupported, voiceOver]);

  const updateScale = (next: number) => {
    const clamped = Math.min(1.2, Math.max(0.9, next));
    setFontScale(clamped);
    speak(`Font size ${Math.round(clamped * 100)} percent`);
  };

  const toggleContrast = (enabled: boolean) => {
    setHighContrast(enabled);
    speak(enabled ? "High contrast enabled" : "High contrast off");
  };

  const toggleVoice = (enabled: boolean) => {
    setVoiceOver(enabled);
    if (!enabled && speechSupported) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <section className="experience-toolbar" aria-label="Accessibility and preference toggles">
      <div className="experience-toolbar__controls">
        <label className="toggle">
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(event) => toggleContrast(event.target.checked)}
          />
          <span>High contrast</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={voiceOver}
            onChange={(event) => toggleVoice(event.target.checked)}
            aria-describedby={speechSupported ? undefined : "voice-unsupported"}
          />
          <span>Voice-over cues</span>
        </label>
        {!speechSupported && (
          <p id="voice-unsupported" className="microcopy">
            Voice-over uses your browser speech engine; it may be unavailable here.
          </p>
        )}
        <div className="font-scale" aria-label="Adjust font size">
          <button type="button" onClick={() => updateScale(fontScale - 0.1)}>
            A-
          </button>
          <label className="font-scale__slider">
            <span className="sr-only">Font size slider</span>
            <input
              type="range"
              min="0.9"
              max="1.2"
              step="0.05"
              value={fontScale}
              onChange={(event) => updateScale(Number(event.target.value))}
              aria-valuemin={0.9}
              aria-valuemax={1.2}
              aria-valuenow={fontScale}
            />
          </label>
          <span aria-live="polite">{Math.round(fontScale * 100)}%</span>
          <button type="button" onClick={() => updateScale(fontScale + 0.1)}>
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
