'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { insightsAPI } from '@/lib/api';
import {
  ArrowIcon, ChartIcon, HourglassIcon, LeafIcon, SunIcon, UnionIcon, WheelIcon,
} from '@/components/nadi/icons';
import { unlockHref } from '@/lib/unlockRedirect';

type Category = { message?: string; advice?: string; rating?: number };
type DailyInsight = {
  date?: string;
  day_of_week?: string;
  day_ruler?: { planet?: string; deity?: string; color?: string };
  energy_level?: { level?: string; description?: string; score?: number };
  categories?: Record<string, Category & { mantra?: string; practice?: string }>;
  lucky_elements?: {
    color?: string; number?: number; direction?: string; auspicious_hours?: string[]; rahu_kalam?: string;
  };
  nadi_note?: string;
  dasha_note?: string;
  method?: string;
  panchanga?: {
    tithi?: string; nakshatra?: string; nakshatra_until?: string; moon_sign?: string; moon_sign_until?: string;
    yoga?: string; tara_bala?: string; chandra_bala?: string; moon_house?: number | null; dasha?: string | null;
  };
  do_list?: string[];
  dont_list?: string[];
};

const CATEGORY_ORDER: Array<[string, string]> = [
  ['career', 'Work'],
  ['love', 'Relationships'],
  ['health', 'Health'],
  ['finance', 'Money'],
];

const CONTINUE = [
  { href: '/bhrigu-predictions/karmic-journey', title: 'Karmic journey', note: "Your soul's purpose and lessons", icon: WheelIcon },
  { href: '/bhrigu-predictions/life-events', title: 'Life events', note: 'Dated windows from your chart', icon: HourglassIcon },
  { href: '/horoscope', title: 'Horoscope', note: 'This week, month and year', icon: SunIcon },
  { href: '/birth-chart', title: 'Birth chart', note: 'Planets, houses and dashas', icon: ChartIcon },
  { href: '/matchmaking', title: 'Compatibility', note: 'Ashtakoot guna milan', icon: UnionIcon },
];

function formatToday() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function TodayPage() {
  const router = useRouter();
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const [profile, setProfile] = useState<any | null | undefined>(undefined);
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  useEffect(() => {
    if (encryptionLoading) return;
    if (!isSetup) router.push('/setup-passcode');
    else if (!isUnlocked) router.push(unlockHref());
  }, [encryptionLoading, isSetup, isUnlocked, router]);

  const loadInsight = useCallback(async (p: any) => {
    setStatus('loading');
    try {
      const response = await insightsAPI.get('daily', {
        date_of_birth: p.dateOfBirth,
        time_of_birth: p.timeOfBirth,
        place_of_birth: p.placeOfBirth,
        latitude: p.latitude,
        longitude: p.longitude,
        timezone: p.timezone,
        // The day and its clock times are reckoned where the reader is now.
        client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } as any);
      setInsight((response?.prediction ?? response?.data ?? response) as DailyInsight);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!encryptionKey) return;
    loadCurrentProfile(encryptionKey)
      .then((p) => {
        setProfile(p ?? null);
        if (p) loadInsight(p);
      })
      .catch(() => setProfile(null));
  }, [encryptionKey, loadInsight]);

  const firstName = (profile?.name || '').split(' ')[0];

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-10 pt-6 md:pt-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-ivory-muted">{formatToday()}</p>
          <h1 className="mt-1 text-3xl text-ivory md:text-4xl">
            {firstName ? `Namaste, ${firstName}` : 'Namaste'}
          </h1>
        </div>
        {profile && (
          <Link
            href="/profile"
            aria-label="Your profile"
            className="grid h-11 w-11 place-items-center rounded-full border border-[color:var(--line)] font-display text-lg text-gold-300"
          >
            {firstName ? firstName[0].toUpperCase() : 'A'}
          </Link>
        )}
      </header>

      {profile === null && (
        <section className="nadi-card mt-6 text-center">
          <p className="nadi-eyebrow">Begin</p>
          <h2 className="mt-2 text-2xl text-ivory">Add your birth details</h2>
          <p className="mt-2 text-sm text-ivory-2">
            Every reading is computed from your exact date, time and place of birth.
          </p>
          <Link href="/get-started" className="nadi-btn mt-5 w-full sm:w-auto">
            Create your profile <ArrowIcon size={18} />
          </Link>
        </section>
      )}

      {profile && (
        <>
          <section aria-labelledby="leaf-heading" className="nadi-leaf mt-6">
            <p id="leaf-heading" className="nadi-eyebrow !text-[0.62rem]">
              Today&apos;s leaf{insight?.day_ruler?.planet ? ` · day of ${insight.day_ruler.planet}` : ''}
            </p>
            {status === 'loading' || status === 'idle' ? (
              <div className="mt-3 space-y-2" aria-busy="true">
                <div className="h-4 w-4/5 animate-pulse rounded bg-[rgba(212,175,95,0.12)]" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-[rgba(212,175,95,0.12)]" />
              </div>
            ) : status === 'error' ? (
              <div className="mt-2">
                <p className="font-display text-lg italic text-ivory">Today&apos;s insight couldn&apos;t be loaded.</p>
                <button type="button" onClick={() => loadInsight(profile)} className="mt-2 text-sm text-gold-300 underline underline-offset-4">
                  Try again
                </button>
              </div>
            ) : (
              <>
                <p className="mt-2 font-display text-[1.15rem] italic leading-snug text-ivory">
                  {insight?.energy_level?.description || insight?.categories?.spiritual?.message}
                </p>
                {insight?.categories?.spiritual?.mantra && (
                  <p className="mt-2 text-sm text-gold-200">{insight.categories.spiritual.mantra}</p>
                )}
              </>
            )}
          </section>

          {status === 'ready' && insight && (
            <>
              <section aria-labelledby="glance" className="mt-8">
                <div className="flex items-baseline justify-between">
                  <h2 id="glance" className="text-xl text-ivory">Today at a glance</h2>
                  {insight.energy_level?.level && <span className="nadi-chip">{insight.energy_level.level} energy</span>}
                </div>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {CATEGORY_ORDER.map(([key, label]) => {
                    const c = insight.categories?.[key];
                    if (!c?.message) return null;
                    return (
                      <li key={key} className="nadi-card !p-4">
                        <p className="nadi-eyebrow !text-[0.62rem]">{label}</p>
                        <p className="mt-1.5 text-[0.95rem] text-ivory">{c.message}</p>
                        {c.advice && <p className="mt-1 text-sm text-ivory-2">{c.advice}</p>}
                      </li>
                    );
                  })}
                </ul>
              </section>

              {insight.panchanga && (
                <section aria-labelledby="panchanga" className="nadi-card mt-4">
                  <h2 id="panchanga" className="nadi-eyebrow !text-[0.62rem]">Today&apos;s panchanga for your chart</h2>
                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
                    {[
                      ['Tithi', insight.panchanga.tithi],
                      ['Nakshatra', insight.panchanga.nakshatra && `${insight.panchanga.nakshatra}${insight.panchanga.nakshatra_until ? ` · until ${insight.panchanga.nakshatra_until}` : ''}`],
                      ['Moon', insight.panchanga.moon_sign && `${insight.panchanga.moon_sign}${insight.panchanga.moon_sign_until ? ` · until ${insight.panchanga.moon_sign_until}` : ''}`],
                      ['Tara bala', insight.panchanga.tara_bala],
                      ['Chandra bala', insight.panchanga.chandra_bala],
                      ['Yoga', insight.panchanga.yoga],
                      ['Running dasha', insight.panchanga.dasha],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={String(k)}>
                        <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-ivory-muted">{k}</dt>
                        <dd className="mt-0.5 text-ivory">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                  {insight.nadi_note && <p className="mt-3 text-sm leading-relaxed text-ivory-2">{insight.nadi_note}</p>}
                  {insight.dasha_note && <p className="mt-2 text-sm leading-relaxed text-ivory-2">{insight.dasha_note}</p>}
                </section>
              )}

              {(insight.do_list?.length || insight.dont_list?.length) ? (
                <section aria-label="Guidance for today" className="nadi-card mt-4 grid gap-5 sm:grid-cols-2">
                  {!!insight.do_list?.length && (
                    <div>
                      <p className="nadi-eyebrow !text-[0.62rem]">Favoured</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-ivory-2">
                        {insight.do_list.slice(0, 5).map((d) => <li key={d}>· {d}</li>)}
                      </ul>
                    </div>
                  )}
                  {!!insight.dont_list?.length && (
                    <div>
                      <p className="nadi-eyebrow !text-[0.62rem] !text-kumkum-300">Avoid</p>
                      <ul className="mt-2 space-y-1.5 text-sm text-ivory-2">
                        {insight.dont_list.slice(0, 4).map((d) => <li key={d}>· {d}</li>)}
                      </ul>
                    </div>
                  )}
                </section>
              ) : null}

              {insight.lucky_elements && (
                <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ['Colour', insight.lucky_elements.color],
                    ['Number', insight.lucky_elements.number],
                    ['Direction', insight.lucky_elements.direction],
                    ['Good hours', insight.lucky_elements.auspicious_hours?.slice(0, 2).join(', ')],
                    ['Rahu kalam', insight.lucky_elements.rahu_kalam],
                  ].filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => (
                    <div key={String(k)} className="rounded-2xl border border-[color:var(--line)] px-4 py-3">
                      <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-ivory-muted">{k}</dt>
                      <dd className="mt-1 text-ivory">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p className="mt-3 text-xs text-ivory-muted">
                {insight.method || 'From your Moon sign, nakshatra and today\u2019s planetary day lord.'}{' '}
                <Link href="/horoscope" className="text-gold-300 underline underline-offset-4">Week, month and year</Link>
              </p>
            </>
          )}

          <section aria-labelledby="continue" className="mt-10">
            <div className="flex items-baseline justify-between">
              <h2 id="continue" className="text-xl text-ivory">Continue</h2>
              <Link href="/bhrigu-predictions" className="text-sm text-gold-300">All readings</Link>
            </div>
            <ul className="mt-2">
              {CONTINUE.map(({ href, title, note, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-4 border-b border-[rgba(212,175,95,0.12)] py-3.5">
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-[color:var(--line)] bg-[rgba(212,175,95,0.04)] text-gold-400">
                      <Icon size={22} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-[0.95rem] text-ivory">{title}</span>
                      <span className="block text-xs text-ivory-muted">{note}</span>
                    </span>
                    <ArrowIcon size={16} className="text-ivory-muted" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <Link href="/bhrigu-predictions" className="nadi-btn-ghost mt-8 w-full">
            <LeafIcon size={18} /> Ask the Samhita a question
          </Link>
        </>
      )}
    </div>
  );
}
