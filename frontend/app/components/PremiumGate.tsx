'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { usePremium } from '@/lib/premium';

/**
 * Shows its children when the reader may see them: always while premium is
 * not enforced, for free features, and for subscribers. Otherwise an
 * invitation to Premium — the reading is not requested at all, so no AI cost.
 */
export function PremiumGate({
  free = false,
  title,
  children,
}: {
  free?: boolean;
  title?: string;
  children: ReactNode;
}) {
  const { loading, unlocked, config } = usePremium();
  if (free || unlocked) return <>{children}</>;
  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-5 pt-10" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[rgba(212,175,95,0.06)]" />
        ))}
      </div>
    );
  }
  return <PremiumInvite title={title} trialDays={config?.trial_days ?? 7} />;
}

export function PremiumInvite({ title, trialDays = 7 }: { title?: string; trialDays?: number }) {
  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-10 pt-10">
      <section className="nadi-leaf text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[color:var(--line)] text-gold-300">
          <Lock size={20} aria-hidden="true" />
        </span>
        <p className="nadi-eyebrow mt-4">BhriguWelt Premium</p>
        <h1 className="mt-2 font-display text-2xl text-ivory">
          {title ? `${title} is part of Premium` : 'This is part of Premium'}
        </h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ivory-2">
          Premium opens every reading from your birth chart, your week, month and year,
          matchmaking, and lets you listen to your readings in a calm, natural voice.
        </p>
        <Link href="/premium" className="nadi-btn mt-6 w-full sm:w-auto">
          <Sparkles size={18} aria-hidden="true" />
          {trialDays > 0 ? `Try ${trialDays} days free` : 'See Premium'}
        </Link>
        <p className="mt-3 text-xs text-ivory-muted">Cancel anytime. Today and your Karmic journey stay free.</p>
      </section>
    </div>
  );
}

export default PremiumGate;
