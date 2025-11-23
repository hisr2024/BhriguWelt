export function isAudioEnabled() {
  if (typeof document === "undefined") return false;
  return document.body.dataset.sound === "on";
}

export function isHapticsEnabled() {
  if (typeof document === "undefined") return false;
  return document.body.dataset.haptics === "on" && typeof navigator !== "undefined" && "vibrate" in navigator;
}

export function areMicroAnimationsAllowed() {
  if (typeof window === "undefined") return false;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const toggle = document.body.dataset.animations;
  if (reducedMotion) return false;
  return toggle !== "off";
}

export function playAudioTone(frequency: number, duration = 120) {
  if (!isAudioEnabled()) return;
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
  setTimeout(() => context.close(), duration + 100);
}

export function triggerHaptic(duration = 18) {
  if (!isHapticsEnabled()) return;
  navigator.vibrate(duration);
}

export function useImmersiveFeedback() {
  return {
    triggerSubmitFeedback: () => {
      triggerHaptic();
      playAudioTone(540, 140);
    },
  };
}
