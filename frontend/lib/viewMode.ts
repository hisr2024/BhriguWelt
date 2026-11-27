'use client';

/**
 * One switch for the whole app: Simple (results only, everyday words) or
 * Astrologer (the same results plus the chart reasoning). Kept on the device.
 */
import { useCallback, useEffect, useState } from 'react';

export type AppViewMode = 'layman' | 'astrologer';

const KEY = 'predictionViewMode';
const EVENT = 'bw-view-mode-changed';

export function readViewMode(): AppViewMode {
  try {
    return localStorage.getItem(KEY) === 'astrologer' ? 'astrologer' : 'layman';
  } catch {
    return 'layman';
  }
}

export function saveViewMode(mode: AppViewMode) {
  try { localStorage.setItem(KEY, mode); } catch { /* ignore */ }
  try { window.dispatchEvent(new Event(EVENT)); } catch { /* ignore */ }
}

export function useViewMode() {
  const [mode, setMode] = useState<AppViewMode>('layman');
  useEffect(() => {
    const read = () => setMode(readViewMode());
    read();
    window.addEventListener(EVENT, read);
    window.addEventListener('storage', read);
    return () => {
      window.removeEventListener(EVENT, read);
      window.removeEventListener('storage', read);
    };
  }, []);
  const change = useCallback((next: AppViewMode) => { setMode(next); saveViewMode(next); }, []);
  return { mode, astro: mode === 'astrologer', setMode: change };
}

const PLANET = '(?:Sun|Moon|Mars|Mercury|Jupiter|Venus|Saturn|Rahu|Ketu)';
const PERIOD_RE = new RegExp(
  `(?:\\b(?:the|in the|during the)\\s+)?${PLANET}(?:\\s*[–-]\\s*${PLANET})*\\s+(?:main |sub-?|short )?period,?\\s*`, 'g');

/** "the Rahu–Sun period, Jun 2026–May 2027" → "Jun 2026–May 2027" for the Simple view. */
export function plainTiming(text: string): string {
  const out = text.replace(PERIOD_RE, (m) => (/^in the|^during the/i.test(m) ? 'in ' : '')).replace(/\s{2,}/g, ' ').trim();
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : text;
}
