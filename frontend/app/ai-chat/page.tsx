'use client';

import Link from 'next/link';
import AIChatInterface from '../components/AIChatInterface';
import ErrorBoundary from '../components/ErrorBoundary';
import { useActiveProfile } from '@/lib/hooks/useActiveProfile';
import { BackIcon } from '@/components/nadi/icons';

export default function AIChatPage() {
  const { profile, profileReady } = useActiveProfile();

  return (
    <ErrorBoundary>
      <div className="mx-auto w-full max-w-3xl px-5 pb-10 pt-6 md:pt-10">
        <Link href="/bhrigu-predictions" className="flex h-11 w-fit items-center gap-2 text-sm text-ivory-2 md:hidden">
          <BackIcon size={18} /> Readings
        </Link>
        <p className="nadi-eyebrow mt-2">Ask the Samhita</p>
        <h1 className="mt-1 text-3xl text-ivory md:text-4xl">A question about your chart</h1>
        <p className="mt-2 max-w-xl text-sm text-ivory-2">
          Answers are written from the chart computed for your birth details, and any statement that
          contradicts that chart is removed before you see it.
        </p>

        {!profileReady && (
          <div className="mt-6 h-64 animate-pulse rounded-2xl bg-[rgba(212,175,95,0.06)]" aria-busy="true" />
        )}

        {profileReady && !profile && (
          <div className="nadi-card mt-6 text-center">
            <p className="text-ivory-2">Questions are answered from your birth chart.</p>
            <Link href="/get-started" className="nadi-btn mt-4">Add your birth details</Link>
          </div>
        )}

        {profileReady && profile && (
          <div className="mt-6 h-[calc(100vh-300px)] min-h-[480px] max-h-[720px]">
            <AIChatInterface birthChartData={profile} context="general" />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
