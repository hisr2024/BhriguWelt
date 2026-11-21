'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { confirmRestore, PurchaseError } from '@/lib/premium';

function Restore() {
  const params = useSearchParams();
  const [state, setState] = useState<'working' | 'done' | 'error'>('working');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('t');
    if (!token) {
      setState('error');
      setMessage('This link is incomplete. Ask for a new one.');
      return;
    }
    confirmRestore(token)
      .then(() => setState('done'))
      .catch((err) => {
        setState('error');
        setMessage(err instanceof PurchaseError ? err.message : 'Please try again.');
      });
  }, [params]);

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-16 text-center">
      {state === 'working' && <p className="text-ivory-2" aria-busy="true">Opening Premium on this device…</p>}
      {state === 'done' && (
        <section className="nadi-leaf">
          <h1 className="font-display text-2xl text-ivory">Premium is open on this device</h1>
          <Link href="/dashboard" className="nadi-btn mt-6">Go to Today</Link>
        </section>
      )}
      {state === 'error' && (
        <section className="nadi-card">
          <p className="text-ivory">{message}</p>
          <Link href="/premium" className="nadi-btn-ghost mt-4">Back to Premium</Link>
        </section>
      )}
    </div>
  );
}

export default function PremiumRestorePage() {
  return (
    <Suspense fallback={null}>
      <Restore />
    </Suspense>
  );
}
