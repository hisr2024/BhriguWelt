'use client';

/**
 * Morning and evening notifications (Web Push).
 *
 * The browser (or the Android app, through Chrome) keeps a push subscription;
 * the backend sends one short message in the morning and one in the evening at
 * the reader's local time. If the reader allows it, their birth details are
 * sent once so the server can work out their natal Moon; only the Moon's sign
 * and nakshatra are kept, never the birth details.
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export interface NotificationPrefs {
  morning: boolean;
  evening: boolean;
  morning_at: string; // HH:MM
  evening_at: string;
  personal: boolean;
}

export interface BirthForNotifications {
  dateOfBirth?: string;
  timeOfBirth?: string;
  placeOfBirth?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

export type NotificationState = 'unsupported' | 'unavailable' | 'denied' | 'off' | 'on';

const PREFS_KEY = 'bhriguwelt_notification_prefs';
const DISMISS_KEY = 'bhriguwelt_notification_prompt_dismissed';
export const DEFAULT_PREFS: NotificationPrefs = {
  morning: true, evening: true, morning_at: '07:00', evening_at: '20:00', personal: true,
};

export class NotificationError extends Error {}

export function supported(): boolean {
  return typeof window !== 'undefined'
    && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function readPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(prefs: NotificationPrefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

export function promptDismissed(): boolean {
  try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
}

export function dismissPrompt() {
  try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
}

let configPromise: Promise<{ available: boolean; public_key: string | null } | null> | null = null;

function loadConfig() {
  if (!configPromise) {
    configPromise = api.get('/api/notifications/config')
      .then((r) => (r.status < 300 ? r.data : null))
      .catch(() => { configPromise = null; return null; });
  }
  return configPromise;
}

function keyBytes(base64url: string): Uint8Array {
  const padded = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  return existing || navigator.serviceWorker.register('/sw.js');
}

async function currentSubscription(): Promise<PushSubscription | null> {
  if (!supported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? reg.pushManager.getSubscription() : null;
}

export async function notificationState(): Promise<NotificationState> {
  if (!supported()) return 'unsupported';
  const config = await loadConfig();
  if (!config?.available || !config.public_key) return 'unavailable';
  if (Notification.permission === 'denied') return 'denied';
  if (Notification.permission !== 'granted') return 'off';
  return (await currentSubscription()) ? 'on' : 'off';
}

function birthPayload(birth?: BirthForNotifications | null) {
  if (!birth?.dateOfBirth || !birth.timeOfBirth) return undefined;
  return {
    date_of_birth: birth.dateOfBirth,
    time_of_birth: birth.timeOfBirth,
    place_of_birth: birth.placeOfBirth,
    latitude: birth.latitude,
    longitude: birth.longitude,
    timezone: birth.timezone,
  };
}

/** Ask permission (if needed), subscribe this device and save the times. */
export async function enableNotifications(
  prefs: NotificationPrefs, birth?: BirthForNotifications | null,
): Promise<NotificationPrefs> {
  if (!supported()) throw new NotificationError('This browser cannot show notifications.');
  const config = await loadConfig();
  if (!config?.available || !config.public_key) throw new NotificationError('Notifications are not available yet.');

  const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new NotificationError(permission === 'denied'
      ? 'Notifications are blocked. Allow them for BhriguWelt in your phone or browser settings.'
      : 'Notifications were not allowed.');
  }

  const reg = await registration();
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: keyBytes(config.public_key) as BufferSource,
    });
  }

  const r = await api.post('/api/notifications/subscribe', {
    subscription: sub.toJSON(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    morning: prefs.morning,
    evening: prefs.evening,
    morning_at: prefs.morning_at,
    evening_at: prefs.evening_at,
    ...(prefs.personal ? { birth: birthPayload(birth) } : { personal: false }),
  });
  if (r.status >= 300) throw new NotificationError('Notifications could not be switched on. Please try again.');
  const saved: NotificationPrefs = {
    morning: r.data.morning, evening: r.data.evening,
    morning_at: r.data.morning_at, evening_at: r.data.evening_at,
    personal: prefs.personal && Boolean(r.data.personal),
  };
  savePrefs(saved);
  return saved;
}

export async function disableNotifications(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) return;
  await api.post('/api/notifications/unsubscribe', { endpoint: sub.endpoint }).catch(() => undefined);
  await sub.unsubscribe().catch(() => undefined);
}

export async function sendTestNotification(): Promise<void> {
  const sub = await currentSubscription();
  if (!sub) throw new NotificationError('Switch notifications on first.');
  const r = await api.post('/api/notifications/test', { endpoint: sub.endpoint });
  if (r.status === 429) throw new NotificationError('Please wait a moment before sending another.');
  if (r.status >= 300) throw new NotificationError('The test message could not be sent.');
}

export function useNotifications() {
  const [state, setState] = useState<NotificationState | null>(null);
  const refresh = useCallback(async () => setState(await notificationState().catch(() => 'unavailable' as const)), []);
  useEffect(() => { refresh(); }, [refresh]);
  return { state, refresh };
}
