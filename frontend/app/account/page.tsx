'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Cloud, LogOut, Mail, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { BackIcon } from '@/components/nadi/icons';
import { GoogleSignInButton } from '@/app/components/GoogleSignInButton';
import {
  AccountError, deleteAccount, loadAccountConfig, refreshAccount, signInWithGoogle, signOut,
  signOutEverywhere, startEmailSignIn, syncProfiles, useAccount, verifyEmailCode, type AccountConfig,
} from '@/lib/account';
import { usePremium } from '@/lib/premium';
import { useEncryption } from '@/lib/context/EncryptionContext';

const errorText = (err: unknown) => (err instanceof AccountError ? err.message : 'Something went wrong. Please try again.');

export default function AccountPage() {
  const { account, signedIn, ready } = useAccount();
  const { encryptionKey } = useEncryption();
  const { status: premium } = usePremium();
  const [config, setConfig] = useState<AccountConfig | null>(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [googleFailed, setGoogleFailed] = useState(false);

  useEffect(() => {
    loadAccountConfig().then(setConfig);
  }, []);

  const sync = useCallback(async () => {
    if (!encryptionKey) {
      setSyncNote('Open the app with your passcode on this device to sync your birth profiles.');
      return;
    }
    try {
      const { added, total } = await syncProfiles(encryptionKey);
      setSyncNote(
        added > 0
          ? `${added} profile${added === 1 ? '' : 's'} added to this device · ${total} saved to your account`
          : `${total} profile${total === 1 ? '' : 's'} saved to your account`,
      );
    } catch (err) {
      setSyncNote(errorText(err));
    }
  }, [encryptionKey]);

  useEffect(() => {
    if (!signedIn) return;
    refreshAccount().then((ok) => { if (ok) sync(); });
  }, [signedIn, sync]);

  const afterSignIn = () => {
    setMessage('You are signed in.');
    setCode('');
    setStep('email');
  };

  const onGoogle = useCallback(async (credential: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await signInWithGoogle(credential);
      afterSignIn();
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const onGoogleError = useCallback((text: string) => {
    if (text.startsWith('Google sign-in could not load')) setGoogleFailed(true);
    else setMessage(text);
  }, []);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await startEmailSignIn(email);
      setStep('code');
      setMessage(`We sent a 6-digit code to ${email}. Check your spam folder if it doesn't arrive.`);
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function checkCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await verifyEmailCode(email, code);
      afterSignIn();
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => Promise<void>, done: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage(done);
    } catch (err) {
      setMessage(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-6 md:pt-10">
      <Link href="/profile" className="flex h-11 w-fit items-center gap-2 text-sm text-ivory-2">
        <BackIcon size={18} /> Me
      </Link>
      <p className="nadi-eyebrow mt-2">Account</p>
      <h1 className="mt-1 text-3xl text-ivory md:text-4xl">
        {signedIn ? 'Your BhriguWelt account' : 'Sign in'}
      </h1>

      {!ready ? null : signedIn ? (
        <>
          <section className="nadi-leaf mt-6">
            <p className="nadi-eyebrow !text-[0.62rem]">Signed in as</p>
            <p className="mt-1 font-display text-xl text-ivory break-all">{account?.email}</p>
            <ul className="mt-4 space-y-2 text-sm text-ivory-2">
              <li className="flex gap-2">
                <Sparkles size={16} className="mt-0.5 flex-none text-gold-300" aria-hidden="true" />
                {premium.active ? 'Premium is active on every device where you sign in.' : 'Free plan. Premium you buy is kept on your account.'}
              </li>
              <li className="flex gap-2">
                <Cloud size={16} className="mt-0.5 flex-none text-gold-300" aria-hidden="true" />
                {syncNote || 'Syncing your birth profiles…'}
              </li>
            </ul>
            {!premium.active && (
              <Link href="/premium" className="nadi-btn mt-5 w-full sm:w-auto">See Premium</Link>
            )}
          </section>

          <section className="mt-8 space-y-3">
            <button type="button" disabled={busy} onClick={() => signOut()} className="nadi-btn-ghost w-full">
              <LogOut size={18} aria-hidden="true" /> Sign out on this device
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(signOutEverywhere, 'Signed out on all devices.')}
              className="h-11 w-full text-sm text-ivory-2 underline underline-offset-4"
            >
              Sign out on all devices
            </button>
          </section>

          <section className="mt-10 border-t border-[rgba(212,175,95,0.12)] pt-6">
            <h2 className="text-lg text-ivory">Delete account</h2>
            <p className="mt-1 text-sm text-ivory-2">
              Deletes your account, its saved birth profiles and its link to your purchases. Profiles on this phone stay
              here. A subscription is not cancelled by this: cancel it in{' '}
              {premium.source === 'play' ? 'Google Play' : 'Manage or cancel on the Premium page'} first.
            </p>
            {confirmDelete ? (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(deleteAccount, 'Your account has been deleted.')}
                  className="nadi-btn !bg-kumkum-500 flex-1"
                >
                  <Trash2 size={18} aria-hidden="true" /> Yes, delete my account
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="nadi-btn-ghost flex-1">
                  Keep it
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="nadi-btn-ghost mt-3 w-full text-kumkum-300">
                <Trash2 size={18} aria-hidden="true" /> Delete account
              </button>
            )}
          </section>
        </>
      ) : (
        <>
          <p className="mt-2 text-ivory-2">
            Optional. Sign in to keep Premium and your birth profiles on every device: phone, app and computer.
          </p>

          <section className="nadi-card mt-6 space-y-5">
            {config?.google_client_id && (
              <GoogleSignInButton clientId={config.google_client_id} onCredential={onGoogle} onError={onGoogleError} />
            )}

            {config?.email && (
              <>
                {config?.google_client_id && !googleFailed && (
                  <p className="text-center text-xs uppercase tracking-[0.14em] text-ivory-muted">or</p>
                )}
                {step === 'email' ? (
                  <form onSubmit={sendCode} className="flex flex-col gap-2">
                    <label htmlFor="account-email" className="text-sm text-ivory-2">E-mail</label>
                    <input
                      id="account-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-12 rounded-xl border border-[color:var(--line)] bg-transparent px-4 text-ivory placeholder:text-ivory-muted"
                    />
                    <button type="submit" disabled={busy} className="nadi-btn-ghost h-12">
                      <Mail size={18} aria-hidden="true" /> Send me a sign-in code
                    </button>
                  </form>
                ) : (
                  <form onSubmit={checkCode} className="flex flex-col gap-2">
                    <label htmlFor="account-code" className="text-sm text-ivory-2">6-digit code</label>
                    <input
                      id="account-code"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                      className="h-12 rounded-xl border border-[color:var(--line)] bg-transparent px-4 text-center text-xl tracking-[0.4em] text-ivory"
                    />
                    <button type="submit" disabled={busy || code.length !== 6} className="nadi-btn h-12">Sign in</button>
                    <button type="button" onClick={() => setStep('email')} className="h-11 text-sm text-ivory-2 underline underline-offset-4">
                      Use a different e-mail
                    </button>
                  </form>
                )}
              </>
            )}

            {config && !config.email && !config.google_client_id && (
              <p className="text-center text-sm text-ivory-2">Signing in opens very soon.</p>
            )}
          </section>

          <p className="mt-4 flex gap-2 text-xs text-ivory-muted">
            <ShieldCheck size={14} className="mt-0.5 flex-none" aria-hidden="true" />
            No password to remember. Your birth profiles are stored encrypted. You can delete your account at any time.
          </p>
        </>
      )}

      {message && <p role="status" className="mt-5 text-center text-sm text-gold-200">{message}</p>}
    </div>
  );
}
