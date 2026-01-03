'use client';

import { useCallback, useEffect, useState } from "react";
import { useThemeMode } from "@/lib/themeContext";

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
  const { mode, setMode } = useThemeMode();
  const [highContrast, setHighContrast] = useState(mode === "high-contrast");
  const [darkMode, setDarkMode] = useState(mode === "dark");
  const [voiceOver, setVoiceOver] = useState(false);
  const [soundscape, setSoundscape] = useState(() => readStoredPreferences().soundscape);
  const [haptics, setHaptics] = useState(() => readStoredPreferences().haptics);
  const [microAnimations, setMicroAnimations] = useState(() => readStoredPreferences().microAnimations);
  const [gestureControls, setGestureControls] = useState(false);
  const [soundscapeLevel, setSoundscapeLevel] = useState(70);
  const speechSupported = typeof window !== "undefined" && Boolean(window.speechSynthesis);

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

  const updateScale = useCallback((next: number) => {
    const clamped = Math.min(1.2, Math.max(0.9, next));
    setFontScale(Number(clamped.toFixed(2)));
  }, []);

  const toggleContrast = useCallback(
    (next: boolean) => {
      setHighContrast(next);
      setMode(next ? "high-contrast" : darkMode ? "dark" : "light");
      if (soundscape && next) {
        playTone(280, 120);
      }
    },
    [darkMode, setMode, soundscape],
  );

  const toggleDarkMode = useCallback(
    (next: boolean) => {
      setDarkMode(next);
      setMode(next ? "dark" : highContrast ? "high-contrast" : "light");
      if (soundscape && next) {
        playTone(320, 120);
      }
    },
    [highContrast, setMode, soundscape],
  );

  const toggleVoice = useCallback(
    (next: boolean) => {
      if (!speechSupported) return;
      setVoiceOver(next);
      if (soundscape && next) {
        playTone(640, 140);
      }
    },
    [soundscape, speechSupported],
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

  useEffect(() => {
    document.body.dataset.gestures = gestureControls ? "on" : "off";
  }, [gestureControls]);

  return (
    <section className="experience-toolbar" aria-label="Accessibility and preference toggles">
      <div className="experience-toolbar__controls">
        <label className="toggle">
          <input type="checkbox" checked={darkMode} onChange={(event) => toggleDarkMode(event.target.checked)} />
          <span>Dark mode</span>
        </label>
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
        <label className="toggle">
          <input
            type="checkbox"
            checked={gestureControls}
            onChange={(event) => setGestureControls(event.target.checked)}
          />
          <span>Gesture controls</span>
        </label>
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
      <div className="experience-toolbar__actions" role="group" aria-label="Immersive feedback controls">
        <label className="assistive-slider" htmlFor="soundscape-level">
          Soundscape level
          <input
            id="soundscape-level"
            type="range"
            min={0}
            max={100}
            step={5}
            value={soundscapeLevel}
            onChange={(event) => {
              const value = Number(event.target.value);
              setSoundscapeLevel(value);
              if (soundscape) {
                playTone(300 + value * 0.8, 80);
              }
            }}
          />
        </label>
        <button
          type="button"
          className="ghost-button small"
          onClick={() => {
            if (soundscape) playTone(540, 160);
            if (haptics && navigator.vibrate) navigator.vibrate([10, 30, 10]);
          }}
        >
          Test sound & haptics
        </button>
      </div>
      <p className="muted experience-toolbar__hint">
        Toggle immersion on or off to suit your focus—contrast, voice, soundscapes, subtle animations, haptics, and gesture prompts all respect the setting.
      </p>
    </section>
  );
}
