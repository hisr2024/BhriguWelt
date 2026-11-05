'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ComponentType } from 'react';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import { getCurrentProfileId, setCurrentProfileId } from '@/lib/profileHelpers';
import type { Profile } from '@/lib/types';
import {
  ArrowIcon, AskIcon, FlameIcon, HourglassIcon, LeafIcon, LotusIcon, RebirthIcon, SunIcon, UnionIcon, WheelIcon,
} from '@/components/nadi/icons';
import { unlockHref } from '@/lib/unlockRedirect';

type Reading = { slug: string; title: string; note: string; icon: ComponentType<{ size?: number }> };

const READINGS: Reading[] = [
  { slug: 'karmic-journey', title: 'Karmic journey', note: "Your soul's purpose and life lessons", icon: WheelIcon },
  { slug: 'past-lives', title: 'Past lives', note: 'Karma carried into this birth', icon: LeafIcon },
  { slug: 'present-life', title: 'Present life', note: 'Where you stand now and what comes next', icon: LotusIcon },
  { slug: 'life-events', title: 'Life events', note: 'Dated windows from your dashas and transits', icon: HourglassIcon },
  { slug: 'relationships', title: 'Relationships', note: 'Bonds, marriage and their timing', icon: UnionIcon },
  { slug: 'karmic-remedies', title: 'Remedies', note: 'Classical upayas for difficult placements', icon: FlameIcon },
  { slug: 'future-lives', title: 'Future lives', note: "The soul's direction after this life", icon: RebirthIcon },
  { slug: 'predictions', title: 'Forecast', note: 'The year ahead, period by period', icon: SunIcon },
];

function formatBirthDate(date?: string) {
  if (!date) return '';
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ReadingsHubPage() {
  const router = useRouter();
  const { isSetup, isUnlocked, isLoading } = useEncryption();
  const { getAllProfiles } = useEncryptedStorage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isSetup) return void router.push('/setup-passcode');
    if (!isUnlocked) return void router.push(unlockHref());
    getAllProfiles()
      .then((list) => {
        setProfiles(list);
        const current = getCurrentProfileId();
        const chosen = list.find((p) => String(p.id) === String(current)) ?? list[0];
        if (chosen?.id !== undefined) setSelectedId(String(chosen.id));
      })
      .catch((error) => console.error('Error loading profiles:', error))
      .finally(() => setReady(true));
  }, [isLoading, isSetup, isUnlocked, getAllProfiles, router]);

  const selected = profiles.find((p) => String(p.id) === selectedId) ?? null;

  const choose = (id: string) => {
    setSelectedId(id);
    setCurrentProfileId(id);
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-5 pb-10 pt-6 md:pt-10">
      <p className="nadi-eyebrow">The Samhita</p>
      <h1 className="mt-1 text-3xl text-ivory md:text-4xl">Choose a reading</h1>
      <p className="mt-2 max-w-xl text-sm text-ivory-2">
        Each reading is computed from your birth chart with Bhrigu Samhita and Nadi Jyotisha rules, then written in
        plain language. Switch to the astrologer view inside any reading for the full technical detail.
      </p>

      {ready && profiles.length === 0 && (
        <div className="nadi-card mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ivory-2">Readings need your birth details first.</p>
          <Link href="/get-started" className="nadi-btn">Create your profile <ArrowIcon size={18} /></Link>
        </div>
      )}

      {profiles.length > 0 && (
        <div className="nadi-card mt-6 flex flex-col gap-3 !py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ivory-2">
            Reading for <span className="text-gold-200">{selected?.name}</span>
            {selected?.dateOfBirth ? ` · ${formatBirthDate(selected.dateOfBirth)}` : ''}
          </p>
          {profiles.length > 1 && (
            <div className="flex items-center gap-2">
              <label htmlFor="reading-profile" className="text-xs text-ivory-muted">Profile</label>
              <select
                id="reading-profile"
                value={selectedId}
                onChange={(e) => choose(e.target.value)}
                className="nadi-input !min-h-[44px] !w-auto !py-2"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {READINGS.map(({ slug, title, note, icon: Icon }) => (
          <li key={slug}>
            <Link
              href={profiles.length ? `/bhrigu-predictions/${slug}` : '/get-started'}
              className="nadi-card group flex h-full items-start gap-4 !p-4 transition-colors hover:border-[color:var(--line-strong)]"
            >
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-[color:var(--line)] bg-[rgba(212,175,95,0.04)] text-gold-400">
                <Icon size={22} />
              </span>
              <span className="flex-1">
                <span className="block font-display text-xl text-ivory">{title}</span>
                <span className="mt-0.5 block text-sm text-ivory-2">{note}</span>
              </span>
              <ArrowIcon size={16} className="mt-1 text-ivory-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/ai-chat" className="nadi-btn-ghost mt-6 w-full sm:w-auto">
        <AskIcon size={18} /> Ask a question about your chart
      </Link>
    </div>
  );
}
