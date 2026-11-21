'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Headphones, Loader2, Pause, Play } from 'lucide-react';
import { api } from '@/lib/api';
import { readEntitlement } from '@/lib/entitlementStore';

const VOICE_KEY = 'bhriguwelt_voice';

export type VoiceChoice = 'female' | 'male';

export function readVoiceChoice(): VoiceChoice {
  try {
    return window.localStorage.getItem(VOICE_KEY) === 'male' ? 'male' : 'female';
  } catch {
    return 'female';
  }
}

export function saveVoiceChoice(v: VoiceChoice) {
  try { window.localStorage.setItem(VOICE_KEY, v); } catch { /* ignore */ }
}

async function cacheKey(text: string, voice: string, lang: string): Promise<string> {
  const data = new TextEncoder().encode(`${voice}|${lang}|${text}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex;
}

// Audio of a reading is personal, and readings are stored encrypted, so the
// spoken copy is kept in memory for this visit only (never on disk). The
// server keeps its own copy, so a replay later is not billed twice.
const sessionAudio = new Map<string, Blob>();

async function cachedAudio(key: string): Promise<Blob | null> {
  return sessionAudio.get(key) ?? null;
}

async function keepAudio(key: string, blob: Blob) {
  if (sessionAudio.size > 20) sessionAudio.delete(sessionAudio.keys().next().value as string);
  sessionAudio.set(key, blob);
}

async function errorFromBlob(blob: Blob): Promise<{ error?: string; seconds_left?: number }> {
  try {
    return JSON.parse(await blob.text());
  } catch {
    return {};
  }
}

function minutes(seconds: number) {
  const m = Math.max(0, Math.round(seconds / 60));
  return m === 1 ? '1 minute' : `${m} minutes`;
}

/**
 * "Listen" — reads the reading aloud (Premium). Replays in this visit are
 * instant; the server's copy means a later replay is not billed again.
 */
export function ListenButton({
  getText,
  label = 'Listen',
  lang = 'en',
  className = '',
}: {
  getText: () => string;
  label?: string;
  lang?: 'en' | 'hi';
  className?: string;
}) {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const play = useCallback((blob: Blob) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(blob);
    urlRef.current = url;
    const audio = audioRef.current ?? new Audio();
    audioRef.current = audio;
    audio.src = url;
    audio.onended = () => setState('idle');
    audio.onpause = () => setState((s) => (s === 'playing' ? 'paused' : s));
    audio.onplay = () => setState('playing');
    audio.play().catch(() => setState('paused'));
  }, []);

  const onClick = useCallback(async () => {
    const audio = audioRef.current;
    if (state === 'playing' && audio) return audio.pause();
    if (state === 'paused' && audio) return void audio.play();
    if (state === 'loading') return;

    const text = getText().trim();
    if (!text) return;
    if (!readEntitlement()) return router.push('/premium?from=listen');

    setNote(null);
    setState('loading');
    const voice = readVoiceChoice();
    const key = await cacheKey(text, voice, lang);
    const kept = await cachedAudio(key);
    if (kept) return play(kept);

    try {
      const r = await api.post('/api/voice/speak', { text, lang, voice }, { responseType: 'blob', timeout: 120000 });
      if (r.status === 200) {
        const blob = r.data as Blob;
        keepAudio(key, blob);
        const left = Number(r.headers?.['x-voice-seconds-left']);
        if (Number.isFinite(left) && left < 10 * 60) setNote(`${minutes(left)} of listening left this month`);
        return play(blob);
      }
      const body = await errorFromBlob(r.data as Blob);
      setState('idle');
      if (r.status === 402) return router.push('/premium?from=listen');
      if (r.status === 429) {
        return setNote(`This month's listening time is used up. It renews on the 1st${
          body.seconds_left ? ` (${minutes(body.seconds_left)} left — try a shorter part)` : ''}.`);
      }
      setNote('The voice is not available right now. Please try again later.');
    } catch {
      setState('idle');
      setNote('The voice could not be loaded. Check your connection and try again.');
    }
  }, [getText, lang, play, router, state]);

  const Icon = state === 'loading' ? Loader2 : state === 'playing' ? Pause : state === 'paused' ? Play : Headphones;
  const text = state === 'loading' ? 'Preparing voice…' : state === 'playing' ? 'Pause' : state === 'paused' ? 'Resume' : label;

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        aria-live="polite"
        className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(212,175,95,0.06)] px-4 text-sm text-gold-200 transition-colors hover:text-gold-100"
      >
        <Icon size={18} aria-hidden="true" className={state === 'loading' ? 'animate-spin' : ''} />
        {text}
      </button>
      {note && <p role="status" className="mt-2 text-xs text-ivory-muted">{note}</p>}
    </div>
  );
}

export default ListenButton;
