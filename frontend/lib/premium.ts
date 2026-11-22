'use client';

/**
 * BhriguWelt Premium — one plan, monthly or yearly.
 *
 * Where the money goes depends on where the app runs:
 *  - Installed from Google Play (Trusted Web Activity): Google Play Billing
 *    through the Digital Goods API, as Play policy requires.
 *  - Website: Stripe Checkout.
 * Either way the backend verifies the purchase with the store and returns a
 * signed entitlement token that this browser keeps (lib/entitlementStore).
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { readEntitlement, saveEntitlement } from './entitlementStore';
import { readSession } from './accountStore';

export type Plan = 'monthly' | 'yearly';

export interface BillingConfig {
  enforced: boolean;
  trial_days: number;
  voice_minutes: number;
  play: { available: boolean; package: string; products: Record<Plan, string> };
  stripe: {
    available: boolean;
    prices: Record<Plan, { currency: string; amount: number; options: Record<string, number>; interval?: string }> | null;
  };
  restore_by_email: boolean;
  voice: { available: boolean; engine: string };
}

export interface PremiumStatus {
  active: boolean;
  enforced?: boolean;
  source?: 'play' | 'stripe';
  plan?: Plan;
  expires?: string | null;
  state?: string;
  cancel_at_period_end?: boolean;
  manage_url?: string;
  voice?: { minutes: number; seconds_left: number };
}

export interface DisplayPrice {
  monthly: string | null;
  yearly: string | null;
  yearlyPerMonth: string | null;
  savePercent: number | null;
}

const PLAY_BILLING = 'https://play.google.com/billing';
/** Categories that stay free: Today, the chart, this reading, daily horoscope. */
export const FREE_READINGS = new Set(['karmic-journey', 'karmic_journey']);

// ── store detection ──────────────────────────────────────────────────────

type DigitalGoodsService = {
  getDetails(ids: string[]): Promise<Array<{ itemId: string; price: { currency: string; value: string } }>>;
  listPurchases(): Promise<Array<{ itemId: string; purchaseToken: string }>>;
};

async function digitalGoods(): Promise<DigitalGoodsService | null> {
  if (typeof window === 'undefined') return null;
  const getter = (window as any).getDigitalGoodsService;
  if (typeof getter !== 'function') return null;
  try {
    return (await getter.call(window, PLAY_BILLING)) as DigitalGoodsService;
  } catch {
    return null;
  }
}

/** True inside the Google Play app (Play Billing must be used there). */
export async function inPlayApp(): Promise<boolean> {
  if (typeof document !== 'undefined' && document.referrer.startsWith('android-app://')) {
    try { sessionStorage.setItem('bw_play_app', '1'); } catch { /* ignore */ }
  }
  let flagged = false;
  try { flagged = sessionStorage.getItem('bw_play_app') === '1'; } catch { /* ignore */ }
  return flagged || (await digitalGoods()) !== null;
}

// ── config & status ──────────────────────────────────────────────────────

let configPromise: Promise<BillingConfig | null> | null = null;
let accountChecked = false;

export function loadBillingConfig(force = false): Promise<BillingConfig | null> {
  if (!configPromise || force) {
    configPromise = api
      .get('/api/billing/config')
      .then((r) => (r.status < 300 ? (r.data as BillingConfig) : null))
      .catch(() => null);
  }
  return configPromise;
}

export async function loadPremiumStatus(fresh = false): Promise<PremiumStatus> {
  if (!readEntitlement()) return { active: false };
  try {
    const r = await api.get(`/api/billing/status${fresh ? '?fresh=1' : ''}`);
    if (r.status >= 300) return { active: false };
    return r.data as PremiumStatus;
  } catch {
    // Offline or backend asleep: trust the token we hold rather than lock a payer out.
    return { active: true, state: 'unverified' };
  }
}

export function usePremium() {
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [status, setStatus] = useState<PremiumStatus>({ active: false });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (fresh = false) => {
    // Signed in: pick up Premium bought on another device (once per page load).
    if (readSession() && !accountChecked) {
      accountChecked = true;
      const { refreshAccount } = await import('./account');
      await refreshAccount();
    }
    const [c, s] = await Promise.all([loadBillingConfig(), loadPremiumStatus(fresh)]);
    setConfig(c);
    setStatus(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh(true);
    window.addEventListener('bw-premium-changed', onChange);
    return () => window.removeEventListener('bw-premium-changed', onChange);
  }, [refresh]);

  // Nothing is locked until the owner switches enforcement on.
  const enforced = Boolean(config?.enforced);
  return {
    loading,
    config,
    status,
    active: status.active,
    enforced,
    unlocked: !enforced || status.active,
    refresh,
  };
}

// ── prices ───────────────────────────────────────────────────────────────

const EURO_REGIONS = new Set(['DE', 'AT', 'FR', 'IT', 'ES', 'NL', 'BE', 'IE', 'PT', 'FI', 'GR', 'LU', 'SK', 'SI', 'EE', 'LV', 'LT', 'CY', 'MT', 'HR']);

export function guessCurrency(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language;
    const region = (new Intl.Locale(locale).maximize().region || '').toUpperCase();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (region === 'IN' || tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') return 'inr';
    if (region === 'GB') return 'gbp';
    if (region === 'US') return 'usd';
    if (EURO_REGIONS.has(region) || tz.startsWith('Europe/')) return 'eur';
  } catch { /* fall through */ }
  return 'usd';
}

const ZERO_DECIMAL = new Set(['jpy', 'krw']);

function fmt(amountMinor: number, currency: string): string {
  const major = ZERO_DECIMAL.has(currency) ? amountMinor : amountMinor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency', currency: currency.toUpperCase(),
      maximumFractionDigits: Number.isInteger(major) ? 0 : 2,
    }).format(major);
  } catch {
    return `${major} ${currency.toUpperCase()}`;
  }
}

function priced(monthlyMinor: number | null, yearlyMinor: number | null, currency: string): DisplayPrice {
  return {
    monthly: monthlyMinor != null ? fmt(monthlyMinor, currency) : null,
    yearly: yearlyMinor != null ? fmt(yearlyMinor, currency) : null,
    yearlyPerMonth: yearlyMinor != null
      ? fmt(currency === 'inr' ? Math.round(yearlyMinor / 1200) * 100 : Math.round(yearlyMinor / 12), currency)
      : null,
    savePercent:
      monthlyMinor && yearlyMinor ? Math.max(0, Math.round((1 - yearlyMinor / (monthlyMinor * 12)) * 100)) : null,
  };
}

export async function playPrices(config: BillingConfig): Promise<DisplayPrice | null> {
  const service = await digitalGoods();
  if (!service) return null;
  try {
    const details = await service.getDetails([config.play.products.monthly, config.play.products.yearly]);
    const by = Object.fromEntries(details.map((d) => [d.itemId, d.price]));
    const m = by[config.play.products.monthly];
    const y = by[config.play.products.yearly];
    const currency = (m || y)?.currency?.toLowerCase() || 'eur';
    const minor = (p?: { value: string }) => (p ? Math.round(parseFloat(p.value) * 100) : null);
    return priced(minor(m) ?? null, minor(y) ?? null, currency);
  } catch {
    return null;
  }
}

export function webPrices(config: BillingConfig, currency = guessCurrency()): DisplayPrice | null {
  const prices = config.stripe.prices;
  if (!prices) return null;
  const pick = (plan: Plan) => {
    const p = prices[plan];
    if (!p) return { amount: null as number | null, cur: currency };
    if (p.options?.[currency] != null) return { amount: p.options[currency], cur: currency };
    return { amount: p.amount, cur: p.currency };
  };
  const m = pick('monthly');
  const y = pick('yearly');
  return priced(m.amount ?? null, m.cur === y.cur ? y.amount ?? null : null, m.cur);
}

// ── buying ───────────────────────────────────────────────────────────────

export class PurchaseError extends Error {}

async function verifyPlayToken(purchaseToken: string): Promise<PremiumStatus> {
  const r = await api.post('/api/billing/play/verify', { purchase_token: purchaseToken });
  if (r.status >= 300 || !r.data?.entitlement) {
    throw new PurchaseError(r.data?.error === 'not_active' ? 'This purchase is not active.' : 'We could not confirm the purchase with Google Play.');
  }
  saveEntitlement(r.data.entitlement);
  return r.data as PremiumStatus;
}

export async function buyOnPlay(config: BillingConfig, plan: Plan): Promise<PremiumStatus> {
  if (typeof PaymentRequest === 'undefined') throw new PurchaseError('Google Play Billing is not available on this device.');
  const sku = config.play.products[plan];
  const request = new PaymentRequest(
    [{ supportedMethods: PLAY_BILLING, data: { sku } }],
    { total: { label: 'BhriguWelt Premium', amount: { currency: 'EUR', value: '0' } } },
  );
  let response: PaymentResponse;
  try {
    response = await request.show();
  } catch (err: any) {
    if (err?.name === 'AbortError') throw new PurchaseError('');
    throw new PurchaseError('Google Play could not start the purchase.');
  }
  const token = (response.details as any)?.purchaseToken || (response.details as any)?.token;
  try {
    const status = await verifyPlayToken(token);
    await response.complete('success');
    return status;
  } catch (err) {
    await response.complete('fail');
    throw err;
  }
}

export async function restoreOnPlay(): Promise<PremiumStatus | null> {
  const service = await digitalGoods();
  if (!service) return null;
  const purchases = await service.listPurchases();
  for (const p of purchases) {
    try {
      return await verifyPlayToken(p.purchaseToken);
    } catch { /* try the next one */ }
  }
  return null;
}

export async function buyOnWeb(plan: Plan, currency = guessCurrency()): Promise<void> {
  const r = await api.post('/api/billing/stripe/checkout', { plan, currency, origin: window.location.origin });
  if (r.status >= 300 || !r.data?.url) throw new PurchaseError('Checkout could not be opened. Please try again.');
  window.location.assign(r.data.url);
}

export async function completeWebCheckout(sessionId: string): Promise<PremiumStatus> {
  const r = await api.post('/api/billing/stripe/complete', { session_id: sessionId });
  if (r.status >= 300 || !r.data?.entitlement) throw new PurchaseError('We could not confirm your payment yet.');
  saveEntitlement(r.data.entitlement);
  return r.data as PremiumStatus;
}

export async function openWebPortal(): Promise<void> {
  const r = await api.post('/api/billing/stripe/portal', { origin: window.location.origin });
  if (r.status >= 300 || !r.data?.url) throw new PurchaseError('The billing page could not be opened.');
  window.location.assign(r.data.url);
}

export async function requestRestoreEmail(email: string): Promise<void> {
  const r = await api.post('/api/billing/restore', { email, origin: window.location.origin });
  if (r.status === 503) throw new PurchaseError('Restoring by e-mail is not available yet.');
  if (r.status >= 300) throw new PurchaseError('Please enter a valid e-mail address.');
}

export async function confirmRestore(token: string): Promise<PremiumStatus> {
  const r = await api.post('/api/billing/restore/confirm', { token });
  if (r.status >= 300 || !r.data?.entitlement) {
    throw new PurchaseError(r.data?.error === 'link_expired' ? 'This link has expired. Ask for a new one.' : 'No active subscription was found.');
  }
  saveEntitlement(r.data.entitlement);
  return r.data as PremiumStatus;
}

export async function redeemAccessCode(code: string): Promise<PremiumStatus> {
  const r = await api.post('/api/billing/review/redeem', { code });
  if (r.status >= 300 || !r.data?.entitlement) throw new PurchaseError('This code is not valid.');
  saveEntitlement(r.data.entitlement);
  return r.data as PremiumStatus;
}
