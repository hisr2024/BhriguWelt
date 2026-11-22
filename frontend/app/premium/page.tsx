'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Headphones, Sparkles } from 'lucide-react';
import {
  buyOnPlay, buyOnWeb, inPlayApp, openWebPortal, playPrices, PurchaseError, redeemAccessCode, requestRestoreEmail,
  restoreOnPlay, usePremium, webPrices, type DisplayPrice, type Plan,
} from '@/lib/premium';
import { BackIcon } from '@/components/nadi/icons';

const INCLUDED = [
  'Every reading from your birth chart: past lives, karmic debts, present life, life events, remedies and more',
  'Your week, month and year, worked out from the planets against your chart',
  'Matchmaking for two charts',
  'Listen to your readings in a calm, natural voice',
  'The astrologer view with the full technical detail',
];

export default function PremiumPage() {
  const { config, status, loading, refresh } = usePremium();
  const [plan, setPlan] = useState<Plan>('yearly');
  const [store, setStore] = useState<'play' | 'web' | null>(null);
  const [prices, setPrices] = useState<DisplayPrice | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    (async () => {
      const play = await inPlayApp();
      if (cancelled) return;
      if (play) {
        setStore(config.play.available ? 'play' : null);
        setPrices(await playPrices(config));
      } else {
        setStore(config.stripe.available ? 'web' : null);
        setPrices(webPrices(config));
      }
    })();
    return () => { cancelled = true; };
  }, [config]);

  const trial = config?.trial_days ?? 7;
  const voiceMinutes = config?.voice_minutes ?? 30;

  async function buy() {
    if (!config || !store) return;
    setBusy(true);
    setMessage(null);
    try {
      if (store === 'play') {
        await buyOnPlay(config, plan);
        await refresh(true);
        setMessage('Welcome to Premium. Every reading is open.');
      } else {
        await buyOnWeb(plan);
      }
    } catch (err) {
      const text = err instanceof PurchaseError ? err.message : 'Something went wrong. Please try again.';
      if (text) setMessage(text);
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    setBusy(true);
    setMessage(null);
    try {
      if (store === 'play') {
        const result = await restoreOnPlay();
        setMessage(result?.active ? 'Your subscription is restored.' : 'No active Google Play subscription was found for this account.');
        await refresh(true);
      } else {
        await requestRestoreEmail(email);
        setMessage('If that address has a subscription, a sign-in link is on its way. It works for 30 minutes.');
      }
    } catch (err) {
      setMessage(err instanceof PurchaseError ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    setBusy(true);
    setMessage(null);
    try {
      await redeemAccessCode(code);
      await refresh(true);
      setMessage('Premium is open on this device.');
    } catch (err) {
      setMessage(err instanceof PurchaseError ? err.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function manage() {
    if (status.source === 'play') {
      window.location.assign(status.manage_url || 'https://play.google.com/store/account/subscriptions');
      return;
    }
    setBusy(true);
    try {
      await openWebPortal();
    } catch (err) {
      setMessage(err instanceof PurchaseError ? err.message : 'Please try again.');
      setBusy(false);
    }
  }

  const priceLine = plan === 'yearly'
    ? prices?.yearly && `${prices.yearly} a year${prices.yearlyPerMonth ? ` · ${prices.yearlyPerMonth} a month` : ''}`
    : prices?.monthly && `${prices.monthly} a month`;

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-6 md:pt-10">
      <Link href="/dashboard" className="flex h-11 w-fit items-center gap-2 text-sm text-ivory-2">
        <BackIcon size={18} /> Today
      </Link>

      <p className="nadi-eyebrow mt-2">BhriguWelt Premium</p>
      <h1 className="mt-1 text-3xl text-ivory md:text-4xl">Your whole leaf, opened</h1>
      <p className="mt-2 text-ivory-2">One plan. Everything in BhriguWelt, read from your exact birth chart.</p>

      {status.active ? (
        <section className="nadi-leaf mt-6">
          <p className="nadi-eyebrow !text-[0.62rem]">You are a Premium member</p>
          <p className="mt-2 font-display text-xl text-ivory">
            {status.plan === 'yearly' ? 'Yearly plan' : status.plan === 'monthly' ? 'Monthly plan' : 'Premium'}
            {status.state === 'trialing' ? ' · free trial' : ''}
          </p>
          {status.expires && (
            <p className="mt-1 text-sm text-ivory-2">
              {status.cancel_at_period_end || status.state === 'SUBSCRIPTION_STATE_CANCELED' ? 'Ends' : 'Renews'} on{' '}
              {new Date(status.expires).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
          {status.voice && (
            <p className="mt-1 text-sm text-ivory-2">
              <Headphones size={14} className="mr-1 inline" aria-hidden="true" />
              {Math.round(status.voice.seconds_left / 60)} of {status.voice.minutes} listening minutes left this month
            </p>
          )}
          <button type="button" onClick={manage} disabled={busy} className="nadi-btn-ghost mt-5 w-full">
            Manage or cancel
          </button>
        </section>
      ) : (
        <>
          <div role="radiogroup" aria-label="Billing" className="mt-6 grid grid-cols-2 gap-3">
            {(['monthly', 'yearly'] as Plan[]).map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={plan === p}
                onClick={() => setPlan(p)}
                className={`relative rounded-2xl border px-4 py-4 text-left transition-colors ${
                  plan === p ? 'border-gold-400 bg-[rgba(212,175,95,0.1)]' : 'border-[color:var(--line)]'
                }`}
              >
                <span className="block text-sm text-ivory">{p === 'yearly' ? 'Yearly' : 'Monthly'}</span>
                <span className="mt-1 block font-display text-xl text-gold-200">
                  {(p === 'yearly' ? prices?.yearly : prices?.monthly) ?? '—'}
                </span>
                <span className="block text-xs text-ivory-muted">{p === 'yearly' ? 'per year' : 'per month'}</span>
                {p === 'yearly' && prices?.savePercent ? (
                  <span className="nadi-chip absolute right-2 top-2 !text-[0.65rem]">Save {prices.savePercent}%</span>
                ) : null}
              </button>
            ))}
          </div>

          <ul className="mt-6 space-y-2.5">
            {INCLUDED.map((line) => (
              <li key={line} className="flex gap-3 text-[0.95rem] text-ivory-2">
                <Check size={18} className="mt-0.5 flex-none text-gold-300" aria-hidden="true" />
                <span>{line.startsWith('Listen') ? `${line} (up to ${voiceMinutes} minutes a month)` : line}</span>
              </li>
            ))}
          </ul>

          {loading ? (
            <div className="mt-6 h-12 animate-pulse rounded-full bg-[rgba(212,175,95,0.08)]" />
          ) : store ? (
            <>
              <button type="button" onClick={buy} disabled={busy} className="nadi-btn mt-7 w-full">
                <Sparkles size={18} aria-hidden="true" />
                {trial > 0 ? `Start ${trial}-day free trial` : 'Subscribe'}
              </button>
              <p className="mt-2 text-center text-xs text-ivory-muted">
                {trial > 0 ? `Free for ${trial} days, then ${priceLine || 'the price shown'}. ` : priceLine ? `${priceLine}. ` : ''}
                Cancel anytime{store === 'play' ? ' in Google Play' : ''}.
              </p>
            </>
          ) : (
            <p className="nadi-card mt-7 text-center text-sm text-ivory-2">
              Premium opens very soon. Everything is free until then.
            </p>
          )}
        </>
      )}

      {message && <p role="status" className="mt-4 text-center text-sm text-gold-200">{message}</p>}

      {!status.active && store && (
        <section className="mt-10 border-t border-[rgba(212,175,95,0.12)] pt-6">
          <h2 className="text-lg text-ivory">Already subscribed?</h2>
          {store === 'play' ? (
            <button type="button" onClick={restore} disabled={busy} className="nadi-btn-ghost mt-3 w-full">
              Restore my Google Play subscription
            </button>
          ) : config?.restore_by_email ? (
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => { e.preventDefault(); restore(); }}
            >
              <label htmlFor="restore-email" className="sr-only">E-mail used at checkout</label>
              <input
                id="restore-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail used at checkout"
                className="h-12 flex-1 rounded-xl border border-[color:var(--line)] bg-transparent px-4 text-ivory placeholder:text-ivory-muted"
              />
              <button type="submit" disabled={busy} className="nadi-btn-ghost h-12">Send link</button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-ivory-2">Open BhriguWelt on the device where you subscribed.</p>
          )}
        </section>
      )}

      {!status.active && (
        <section className="mt-8">
          {showCode ? (
            <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); redeem(); }}>
              <label htmlFor="access-code" className="sr-only">Access code</label>
              <input
                id="access-code"
                required
                autoCapitalize="characters"
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Access code"
                className="h-12 flex-1 rounded-xl border border-[color:var(--line)] bg-transparent px-4 text-ivory placeholder:text-ivory-muted"
              />
              <button type="submit" disabled={busy} className="nadi-btn-ghost h-12">Apply</button>
            </form>
          ) : (
            <button type="button" onClick={() => setShowCode(true)} className="h-11 text-sm text-ivory-2 underline underline-offset-4">
              Have an access code?
            </button>
          )}
        </section>
      )}

      <p className="mt-10 text-xs leading-relaxed text-ivory-muted">
        Prices include tax where it applies. Subscriptions renew automatically until cancelled.{' '}
        <Link href="/terms" className="underline underline-offset-4">Terms</Link> ·{' '}
        <Link href="/privacy" className="underline underline-offset-4">Privacy</Link>
      </p>
    </div>
  );
}
