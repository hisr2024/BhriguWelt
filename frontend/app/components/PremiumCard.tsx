'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Headphones, Sparkles } from 'lucide-react';
import { usePremium } from '@/lib/premium';
import { readVoiceChoice, saveVoiceChoice, type VoiceChoice } from '@/app/components/ListenButton';

/** "Me" page: Premium status and the reading voice. */
export function PremiumCard() {
  const { status, loading } = usePremium();
  const [voice, setVoice] = useState<VoiceChoice>('female');

  useEffect(() => setVoice(readVoiceChoice()), []);

  if (loading) return null;
  return (
    <section className="nadi-card" aria-labelledby="premium-card-title">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="nadi-eyebrow !text-[0.62rem]">Membership</p>
          <h2 id="premium-card-title" className="mt-1 font-display text-xl text-ivory">
            {status.active ? 'BhriguWelt Premium' : 'Free plan'}
          </h2>
        </div>
        <Link href="/premium" className={status.active ? 'nadi-btn-ghost' : 'nadi-btn'}>
          {status.active ? 'Manage' : (<><Sparkles size={16} aria-hidden="true" /> Premium</>)}
        </Link>
      </div>
      {status.active && status.voice && (
        <p className="mt-3 text-sm text-ivory-2">
          {Math.round(status.voice.seconds_left / 60)} of {status.voice.minutes} listening minutes left this month
        </p>
      )}
      <fieldset className="mt-4">
        <legend className="flex items-center gap-2 text-sm text-ivory-2">
          <Headphones size={16} aria-hidden="true" /> Reading voice
        </legend>
        <div className="mt-2 flex gap-2">
          {(['female', 'male'] as VoiceChoice[]).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={voice === v}
              onClick={() => { setVoice(v); saveVoiceChoice(v); }}
              className={`h-11 rounded-full border px-4 text-sm ${
                voice === v ? 'border-gold-400 bg-[rgba(212,175,95,0.1)] text-gold-200' : 'border-[color:var(--line)] text-ivory-2'
              }`}
            >
              {v === 'female' ? 'Female voice' : 'Male voice'}
            </button>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

export default PremiumCard;
