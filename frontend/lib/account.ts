'use client';

/**
 * Optional BhriguWelt account (Google or e-mail code). Signing in links the
 * device's Premium purchase to the account, brings Premium to every device
 * where the person signs in, and keeps birth profiles in step.
 */
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { readSession, readStoredAccount, saveSession, type StoredAccount } from './accountStore';
import { saveEntitlement } from './entitlementStore';
import { getAllItems, setItem, STORES } from './storage';
import type { Profile } from './types';

export interface AccountConfig {
  email: boolean;
  google_client_id: string | null;
}

export class AccountError extends Error {}

interface SignInResult {
  session: string;
  user: StoredAccount;
  premium: { active: boolean; entitlement?: string };
}

let configPromise: Promise<AccountConfig | null> | null = null;

export function loadAccountConfig(): Promise<AccountConfig | null> {
  if (!configPromise) {
    configPromise = api
      .get('/api/account/config')
      .then((r) => (r.status < 300 ? (r.data as AccountConfig) : null))
      .catch(() => null);
  }
  return configPromise;
}

function signedIn(data: SignInResult) {
  saveSession(data.session, { email: data.user.email, name: data.user.name });
  if (data.premium?.active && data.premium.entitlement) saveEntitlement(data.premium.entitlement);
}

export async function startEmailSignIn(email: string): Promise<void> {
  const r = await api.post('/api/account/email/start', { email });
  if (r.status === 200) return;
  const error = r.data?.error;
  if (error === 'invalid_email') throw new AccountError('Please enter a valid e-mail address.');
  if (error === 'too_many_codes') throw new AccountError('Too many codes were sent. Please wait an hour and try again.');
  if (error === 'email_unavailable') throw new AccountError('Signing in by e-mail is not available yet.');
  throw new AccountError('The code could not be sent. Please try again.');
}

export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const r = await api.post('/api/account/email/verify', { email, code });
  if (r.status !== 200 || !r.data?.session) throw new AccountError('This code is not right or has expired.');
  signedIn(r.data as SignInResult);
}

export async function signInWithGoogle(credential: string): Promise<void> {
  const r = await api.post('/api/account/google', { credential });
  if (r.status !== 200 || !r.data?.session) throw new AccountError('Google sign-in did not work. Please try again.');
  signedIn(r.data as SignInResult);
}

/** Refresh the session and Premium (e.g. after a purchase on another device). */
export async function refreshAccount(): Promise<boolean> {
  if (!readSession()) return false;
  try {
    const r = await api.get('/api/account/me');
    if (r.status === 403) {
      signOut(false);
      return false;
    }
    if (r.status === 200) signedIn(r.data as SignInResult);
    return r.status === 200;
  } catch {
    return true; // offline: stay signed in
  }
}

export function signOut(clearPremium = true): void {
  saveSession(null, null);
  if (clearPremium) saveEntitlement(null);
}

export async function signOutEverywhere(): Promise<void> {
  await api.post('/api/account/signout-all', {});
  signOut();
}

export async function deleteAccount(): Promise<void> {
  const r = await api.delete('/api/account');
  if (r.status !== 200) throw new AccountError('The account could not be deleted. Please try again.');
  signOut();
}

// ── profile sync ─────────────────────────────────────────────────────────

const profileKey = (p: Partial<Profile>) =>
  [p.name, p.dateOfBirth, p.timeOfBirth, p.placeOfBirth].map((v) => String(v ?? '').trim().toLowerCase()).join('|');

/**
 * Two-way merge: profiles missing on this device are added here, and the
 * union is saved to the account. Nothing is deleted on either side.
 */
export async function syncProfiles(encryptionKey: CryptoKey): Promise<{ added: number; total: number }> {
  if (!readSession()) return { added: 0, total: 0 };
  const r = await api.get('/api/account/profiles');
  if (r.status !== 200) throw new AccountError('Profiles could not be synced.');
  const remote: Profile[] = r.data?.profiles ?? [];
  const local = ((await getAllItems(STORES.PROFILES, encryptionKey)) as Profile[]).map(({ id: _id, ...rest }) => rest as Profile);

  const seen = new Set(local.map(profileKey));
  const missing = remote.filter((p) => !seen.has(profileKey(p)));
  for (let i = 0; i < missing.length; i++) {
    await setItem(STORES.PROFILES, `profile_${Date.now()}_${i}`, missing[i], encryptionKey);
  }

  const union: Profile[] = [];
  const keys = new Set<string>();
  for (const p of [...local, ...missing]) {
    const k = profileKey(p);
    if (!keys.has(k)) {
      keys.add(k);
      union.push(p);
    }
  }
  await api.put('/api/account/profiles', { profiles: union });
  return { added: missing.length, total: union.length };
}

// ── hook ─────────────────────────────────────────────────────────────────

export function useAccount() {
  const [account, setAccount] = useState<StoredAccount | null>(null);
  const [ready, setReady] = useState(false);

  const read = useCallback(() => {
    setAccount(readSession() ? readStoredAccount() : null);
    setReady(true);
  }, []);

  useEffect(() => {
    read();
    window.addEventListener('bw-account-changed', read);
    return () => window.removeEventListener('bw-account-changed', read);
  }, [read]);

  return { account, signedIn: Boolean(account), ready };
}
