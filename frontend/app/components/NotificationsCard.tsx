'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Moon, Sun } from 'lucide-react';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import {
  disableNotifications, dismissPrompt, enableNotifications, NotificationError, promptDismissed, readPrefs,
  sendTestNotification, useNotifications, type BirthForNotifications, type NotificationPrefs,
} from '@/lib/notifications';

const errorText = (err: unknown) =>
  err instanceof NotificationError ? err.message : 'Something went wrong. Please try again.';

function useBirth(): BirthForNotifications | null {
  const { encryptionKey } = useEncryption();
  const [birth, setBirth] = useState<BirthForNotifications | null>(null);
  useEffect(() => {
    if (!encryptionKey) return;
    loadCurrentProfile(encryptionKey).then((p) => setBirth(p ?? null)).catch(() => setBirth(null));
  }, [encryptionKey]);
  return birth;
}

/** Full settings: on/off, morning and evening times, personal messages, test. */
export function NotificationsCard() {
  const { state, refresh } = useNotifications();
  const birth = useBirth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => readPrefs());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!state || state === 'unsupported' || state === 'unavailable') return null;

  async function apply(next: NotificationPrefs, done?: string) {
    setBusy(true);
    setMessage(null);
    try {
      setPrefs(await enableNotifications(next, birth));
      await refresh();
      if (done) setMessage(done);
    } catch (err) {
      setMessage(errorText(err));
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setMessage(null);
    try {
      await disableNotifications();
      await refresh();
      setMessage('Notifications are off on this device.');
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    try {
      await sendTestNotification();
      setMessage('Sent. It should arrive in a few seconds.');
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const on = state === 'on';
  const change = (patch: Partial<NotificationPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    if (on) apply(next);
  };

  return (
    <section className="nadi-card" aria-labelledby="notifications-title">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-full border border-[color:var(--line)] text-gold-300">
            {on ? <Bell size={20} aria-hidden="true" /> : <BellOff size={20} aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <p className="nadi-eyebrow !text-[0.62rem]">Notifications</p>
            <h2 id="notifications-title" className="text-[0.95rem] text-ivory">
              {on ? 'Morning and evening, on this device' : 'Your leaf, morning and evening'}
            </h2>
          </div>
        </div>
        {on ? (
          <button type="button" disabled={busy} onClick={turnOff} className="nadi-btn-ghost flex-none">Turn off</button>
        ) : (
          <button
            type="button"
            disabled={busy || state === 'denied'}
            onClick={() => apply(prefs, 'Notifications are on.')}
            className="nadi-btn flex-none"
          >
            Turn on
          </button>
        )}
      </div>

      {state === 'denied' && (
        <p className="mt-3 text-sm text-ivory-2">
          Notifications are blocked for BhriguWelt. Allow them in your phone or browser settings, then come back here.
        </p>
      )}

      <div className="mt-4 space-y-3">
        {([
          ['morning', 'morning_at', 'Morning', 'What today holds for you', Sun],
          ['evening', 'evening_at', 'Evening', 'What tomorrow brings', Moon],
        ] as const).map(([flag, at, label, note, Icon]) => (
          <div key={flag} className="flex items-center justify-between gap-3">
            <label className="flex min-w-0 flex-1 items-center gap-3">
              <input
                type="checkbox"
                checked={prefs[flag]}
                disabled={busy}
                onChange={(e) => change({ [flag]: e.target.checked } as Partial<NotificationPrefs>)}
                className="h-5 w-5 flex-none accent-[#D4AF5F]"
              />
              <Icon size={16} className="flex-none text-gold-300" aria-hidden="true" />
              <span className="min-w-0">
                <span className="block text-sm text-ivory">{label}</span>
                <span className="block text-xs text-ivory-muted">{note}</span>
              </span>
            </label>
            <input
              type="time"
              aria-label={`${label} time`}
              value={prefs[at]}
              disabled={busy || !prefs[flag]}
              onChange={(e) => e.target.value && change({ [at]: e.target.value } as Partial<NotificationPrefs>)}
              className="h-11 w-[8.75rem] flex-none rounded-xl border border-[color:var(--line)] bg-transparent px-3 text-ivory"
            />
          </div>
        ))}
        <label className="flex items-start gap-3 pt-1">
          <input
            type="checkbox"
            checked={prefs.personal}
            disabled={busy}
            onChange={(e) => change({ personal: e.target.checked })}
            className="mt-0.5 h-5 w-5 flex-none accent-[#D4AF5F]"
          />
          <span className="text-xs text-ivory-2">
            Personal to my chart. Your birth details are used once to find your birth Moon; only its sign and star are
            kept for the messages.
          </span>
        </label>
      </div>

      {on && (
        <button type="button" disabled={busy} onClick={test} className="mt-4 h-11 text-sm text-ivory-2 underline underline-offset-4">
          Send me one now
        </button>
      )}
      {message && <p role="status" className="mt-3 text-sm text-gold-200">{message}</p>}
    </section>
  );
}

/** Small invitation on Today, shown until the reader turns notifications on or says not now. */
export function NotificationsPrompt() {
  const { state, refresh } = useNotifications();
  const birth = useBirth();
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { setHidden(promptDismissed()); }, []);

  if (state !== 'off' || hidden) {
    return message ? <p role="status" className="mt-4 text-center text-sm text-gold-200">{message}</p> : null;
  }

  async function turnOn() {
    setBusy(true);
    try {
      await enableNotifications(readPrefs(), birth);
      setMessage('Notifications are on: your leaf each morning, tomorrow’s outlook each evening.');
      dismissPrompt();
      setHidden(true);
      await refresh();
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="nadi-card mt-6" aria-labelledby="notify-prompt-title">
      <div className="flex items-start gap-3">
        <Bell size={20} className="mt-0.5 flex-none text-gold-300" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="notify-prompt-title" className="text-[0.95rem] text-ivory">Your leaf, morning and evening</h2>
          <p className="mt-1 text-sm text-ivory-2">
            A short note at 7:00 on what today holds for you, and at 20:00 on what tomorrow brings. Change the times
            any time under Me.
          </p>
          <div className="mt-3 flex gap-2">
            <button type="button" disabled={busy} onClick={turnOn} className="nadi-btn">Turn on</button>
            <button type="button" onClick={() => { dismissPrompt(); setHidden(true); }} className="nadi-btn-ghost">
              Not now
            </button>
          </div>
          {message && <p role="status" className="mt-2 text-sm text-gold-200">{message}</p>}
        </div>
      </div>
    </section>
  );
}

export default NotificationsCard;
