'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { insightsAPI, type InsightScope } from '@/lib/api';
import { BackIcon } from '@/components/nadi/icons';
import { unlockHref } from '@/lib/unlockRedirect';

const SCOPES: Array<{ id: InsightScope; label: string; aliases: string[] }> = [
  { id: 'daily', label: 'Today', aliases: ['daily', 'today', 'day'] },
  { id: 'weekly', label: 'This week', aliases: ['weekly', 'week'] },
  { id: 'monthly', label: 'This month', aliases: ['monthly', 'month'] },
  { id: 'yearly', label: 'This year', aliases: ['yearly', 'year'] },
];

const HEADINGS: Record<InsightScope, string> = {
  daily: 'Your day', weekly: 'Your week', monthly: 'Your month', yearly: 'Your year',
};

const SECTION_LABELS: Record<string, string> = {
  career: 'Work', love: 'Relationships', health: 'Health', finance: 'Money', spiritual: 'Spiritual',
};

function scopeFromParam(param?: string | string[]): InsightScope {
  const value = (Array.isArray(param) ? param[0] : param)?.toLowerCase();
  return SCOPES.find((s) => value && s.aliases.includes(value))?.id ?? 'daily';
}

const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);

export default function HoroscopePage() {
  const params = useParams<{ scope?: string }>();
  const router = useRouter();
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const [scope, setScope] = useState<InsightScope>(scopeFromParam(params?.scope));
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'no-profile'>('loading');

  useEffect(() => {
    if (encryptionLoading) return;
    if (!isSetup) router.push('/setup-passcode');
    else if (!isUnlocked) router.push(unlockHref());
  }, [encryptionLoading, isSetup, isUnlocked, router]);

  const load = useCallback(async () => {
    if (!encryptionKey) return;
    setStatus('loading');
    try {
      const profile = await loadCurrentProfile(encryptionKey);
      if (!profile) return setStatus('no-profile');
      const response = await insightsAPI.horoscope(scope, {
        date_of_birth: profile.dateOfBirth,
        time_of_birth: profile.timeOfBirth,
        place_of_birth: profile.placeOfBirth,
        latitude: profile.latitude,
        longitude: profile.longitude,
        timezone: profile.timezone,
        client_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } as any);
      setData(response?.prediction ?? response?.data ?? response);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [encryptionKey, scope]);

  useEffect(() => {
    load();
  }, [load]);

  const theme = data?.weekly_theme || data?.monthly_theme || data?.yearly_theme;
  const headline = text(theme?.title) || (data?.overall?.energy ? (data.overall.energy === 'Go gently' ? 'A day to go gently' : `${data.overall.energy} day`) : null);
  const summary = text(theme?.summary) || text(data?.overall?.message);
  const sections: Array<[string, any]> = Object.entries(data?.sections ?? {}).filter(([k]) => SECTION_LABELS[k]);
  const mantra = text(data?.daily_mantra) || text(data?.weekly_mantra) || text(data?.monthly_mantra) || text(data?.yearly_mantra);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-10 pt-6 md:pt-10">
      <Link href="/dashboard" className="flex h-11 w-fit items-center gap-2 text-sm text-ivory-2 md:hidden">
        <BackIcon size={18} /> Today
      </Link>
      <p className="nadi-eyebrow mt-2">Horoscope</p>
      <h1 className="mt-1 text-3xl text-ivory md:text-4xl">{HEADINGS[scope]}</h1>

      <div role="tablist" aria-label="Period" className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={scope === s.id}
            onClick={() => setScope(s.id)}
            className={`h-11 flex-none rounded-full border px-4 text-sm transition-colors ${
              scope === s.id
                ? 'border-gold-400 bg-[rgba(212,175,95,0.1)] text-gold-200'
                : 'border-[color:var(--line)] text-ivory-2 hover:text-ivory'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {status === 'loading' && (
        <div className="mt-6 space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-[rgba(212,175,95,0.06)]" />)}
        </div>
      )}

      {status === 'no-profile' && (
        <div className="nadi-card mt-6 text-center">
          <p className="text-ivory-2">Your horoscope is computed from your birth chart.</p>
          <Link href="/get-started" className="nadi-btn mt-4">Add your birth details</Link>
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="nadi-card mt-6 text-center">
          <p className="font-display text-xl text-ivory">This horoscope couldn&apos;t be loaded.</p>
          <p className="mt-1 text-sm text-ivory-2">Check your connection and try again.</p>
          <button type="button" onClick={load} className="nadi-btn mt-4">Try again</button>
        </div>
      )}

      {status === 'ready' && data && (
        <>
          <section className="nadi-leaf mt-6">
            <p className="nadi-eyebrow !text-[0.62rem]">
              {[data?.metadata?.moon_sign && `Moon in ${data.metadata.moon_sign}`, data?.metadata?.nakshatra, data?.metadata?.day_ruler && `day of ${data.metadata.day_ruler}`]
                .filter(Boolean).join(' · ') || 'Bhrigu Samhita'}
            </p>
            {headline && <p className="mt-1 font-display text-xl text-gold-200">{headline}</p>}
            {summary && <p className="mt-1 font-display text-[1.1rem] italic leading-snug text-ivory">{summary}</p>}
          </section>

          {text(data?.bhrigu_guidance) && (
            <p className="mt-5 border-l-2 border-gold-400 pl-4 text-[0.95rem] leading-relaxed text-ivory-2">{data.bhrigu_guidance}</p>
          )}

          {data?.panchanga && (
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-[color:var(--line)] px-4 py-3 text-sm sm:grid-cols-3">
              {[
                ['Tithi', data.panchanga.tithi],
                ['Nakshatra', data.panchanga.nakshatra && `${data.panchanga.nakshatra}${data.panchanga.nakshatra_until ? ` · until ${data.panchanga.nakshatra_until}` : ''}`],
                ['Tara bala', data.panchanga.tara_bala],
                ['Chandra bala', data.panchanga.chandra_bala],
                ['Yoga', data.panchanga.yoga],
                ['Running dasha', data.panchanga.dasha],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-[0.7rem] uppercase tracking-[0.14em] text-ivory-muted">{k}</dt>
                  <dd className="mt-0.5 text-ivory">{String(v)}</dd>
                </div>
              ))}
            </dl>
          )}

          {sections.length > 0 && (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {sections.map(([key, sec]) => (
                <li key={key} className="nadi-card !p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="nadi-eyebrow !text-[0.62rem]">{SECTION_LABELS[key]}</p>
                    {sec?.key_day && <span className="text-xs text-ivory-muted">Key day: {sec.key_day}</span>}
                  </div>
                  <p className="mt-1.5 text-[0.95rem] text-ivory">{text(sec?.summary) || text(sec?.message) || text(sec?.insight)}</p>
                  {[sec?.opportunity, sec?.focus, sec?.caution, sec?.practice, sec?.challenges].filter(text).slice(0, 2).map((line: string) => (
                    <p key={line} className="mt-1 text-sm text-ivory-2">{line}</p>
                  ))}
                </li>
              ))}
            </ul>
          )}

          {Array.isArray(data?.daily_summaries) && data.daily_summaries.length > 0 && (
            <section className="mt-6">
              <h2 className="text-xl text-ivory">Day by day</h2>
              <ul className="mt-2 divide-y divide-[rgba(212,175,95,0.12)]">
                {data.daily_summaries.map((d: any) => (
                  <li key={d.date} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-ivory">{d.day}</span>
                    <span className="text-ivory-2">{d.focus}</span>
                    <span className="text-xs text-gold-300">{d.energy}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {Array.isArray(data?.important_dates) && data.important_dates.length > 0 && (
            <section className="mt-6">
              <h2 className="text-xl text-ivory">Dates to note</h2>
              <ul className="mt-2 divide-y divide-[rgba(212,175,95,0.12)]">
                {data.important_dates.map((d: any) => (
                  <li key={`${d.date}-${d.event}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="text-ivory">{d.event}</span>
                    <span className="flex-none text-xs text-gold-300">
                      {new Date(d.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {mantra && (
            <div className="mt-6 rounded-2xl border border-[color:var(--line)] px-4 py-3 text-center">
              <p className="text-[0.7rem] uppercase tracking-[0.14em] text-ivory-muted">Mantra</p>
              <p className="mt-1 font-display text-lg text-gold-200">{mantra}</p>
            </div>
          )}

          <p className="mt-4 text-xs text-ivory-muted">
            Computed from your Moon sign, nakshatra and the planetary rulers of the period.
          </p>
        </>
      )}
    </div>
  );
}
