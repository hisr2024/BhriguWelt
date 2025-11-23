'use client';

import { useCallback, useEffect, useState } from "react";

const storageKey = "bhrigu-experience-preferences";

type StoredPreferences = {
  soundscape: boolean;
  haptics: boolean;
  microAnimations: boolean;
};

function readStoredPreferences(): StoredPreferences {
  if (typeof window === "undefined") {
    return { soundscape: false, haptics: false, microAnimations: true };
  }

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { soundscape: false, haptics: false, microAnimations: true };
    const parsed = JSON.parse(raw) as Partial<StoredPreferences>;
    return {
      soundscape: Boolean(parsed.soundscape),
      haptics: Boolean(parsed.haptics),
      microAnimations: parsed.microAnimations !== undefined ? Boolean(parsed.microAnimations) : true,
    };
  } catch (error) {
    console.error("Unable to read immersive preferences", error);
    return { soundscape: false, haptics: false, microAnimations: true };
  }
}

function storePreferences(preferences: StoredPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(preferences));
}

function playTone(frequency: number, duration = 140) {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;

  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start();

  gainNode.gain.setValueAtTime(0.0001, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration / 1000);

  oscillator.stop(context.currentTime + duration / 1000);
  setTimeout(() => context.close(), duration + 120);
}

export default function ExperienceToolbar() {
  const [fontScale, setFontScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [voiceOver, setVoiceOver] = useState(false);
  const [soundscape, setSoundscape] = useState(() => readStoredPreferences().soundscape);
  const [haptics, setHaptics] = useState(() => readStoredPreferences().haptics);
  const [microAnimations, setMicroAnimations] = useState(() => readStoredPreferences().microAnimations);

  const persistPreferences = useCallback(
    (prefs: Partial<StoredPreferences>) => {
      const merged = {
        soundscape,
        haptics,
        microAnimations,
        ...prefs,
      };
      storePreferences(merged as StoredPreferences);
    },
    [haptics, microAnimations, soundscape],
  );

  const handleSoundscapeChange = useCallback(
    (next: boolean) => {
      setSoundscape(next);
      persistPreferences({ soundscape: next });
      if (next) {
        playTone(420, 180);
      }
    },
    [persistPreferences],
  );

  const handleHapticsChange = useCallback(
    (next: boolean) => {
      setHaptics(next);
      persistPreferences({ haptics: next });
      if (next) {
        playTone(520, 120);
      }
    },
    [persistPreferences],
  );

  const handleMicroAnimationsChange = useCallback(
    (next: boolean) => {
      setMicroAnimations(next);
      persistPreferences({ microAnimations: next });
      if (soundscape && next) {
        playTone(360, 110);
      }
    },
    [persistPreferences, soundscape],
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
    document.body.dataset.sound = soundscape ? "on" : "off";
  }, [soundscape]);

  useEffect(() => {
    document.body.dataset.haptics = haptics ? "on" : "off";
  }, [haptics]);

  useEffect(() => {
    document.body.dataset.animations = microAnimations ? "on" : "off";
  }, [microAnimations]);

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
        <label className="toggle">
          <input
            type="checkbox"
            checked={soundscape}
            onChange={(event) => handleSoundscapeChange(event.target.checked)}
          />
          <span>Soft soundscapes</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={haptics}
            onChange={(event) => handleHapticsChange(event.target.checked)}
          />
          <span>Haptics on submit</span>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={microAnimations}
            onChange={(event) => handleMicroAnimationsChange(event.target.checked)}
          />
          <span>Micro-animations</span>
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
        Toggle immersion on or off to suit your focus—contrast, voice, soundscapes, subtle animations, and haptics all respect the setting.
      </p>
    </section>
  );
}
