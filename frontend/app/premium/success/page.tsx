'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { completeWebCheckout, PurchaseError } from '@/lib/premium';

function Success() {
  const params = useSearchParams();
  const [state, setState] = useState<'working' | 'done' | 'error'>('working');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const id = params.get('session_id');
    if (!id) {
      setState('error');
      setMessage('This page is opened after checkout.');
      return;
    }
    let tries = 0;
    const attempt = async () => {
      try {
        await completeWebCheckout(id);
        setState('done');
      } catch (err) {
        // Stripe can take a moment to mark the session complete.
        if (++tries < 4) return void setTimeout(attempt, 2000);
        setState('error');
        setMessage(err instanceof PurchaseError ? err.message : 'Please refresh this page in a minute.');
      }
    };
    attempt();
  }, [params]);

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-12 pt-16 text-center">
      {state === 'working' && <p className="text-ivory-2" aria-busy="true">Confirming your payment…</p>}
      {state === 'done' && (
        <section className="nadi-leaf">
          <p className="nadi-eyebrow">Welcome</p>
          <h1 className="mt-2 font-display text-2xl text-ivory">Premium is open</h1>
          <p className="mt-2 text-ivory-2">Every reading, your week, month and year, matchmaking and listening are yours.</p>
          <Link href="/bhrigu-predictions" className="nadi-btn mt-6">Choose a reading</Link>
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

export default function PremiumSuccessPage() {
  return (
    <Suspense fallback={null}>
      <Success />
    </Suspense>
  );
}
