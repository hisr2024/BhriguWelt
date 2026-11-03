'use client';

/**
 * Optional inputs that sharpen a Bhrigu / Nadi reading:
 *  - gender: selects the jiva karaka in Bhrigu Nandi Nadi (Jupiter for a
 *    male chart, Venus for a female chart). "Prefer not to say" simply skips
 *    that rule — it is never guessed.
 *  - birth-time accuracy: decides how much weight house/degree-based
 *    statements get (Lagna moves ~1° every 4 minutes).
 */
import type { BirthTimeAccuracy, Gender } from '@/lib/types';

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Prefer not to say' },
];

export const ACCURACY_OPTIONS: { value: BirthTimeAccuracy; label: string; hint: string }[] = [
  { value: 'exact', label: 'Exact', hint: 'From a birth certificate or hospital record' },
  { value: 'within_15', label: '± 15 min', hint: 'Remembered by family, fairly sure' },
  { value: 'within_hour', label: '± 1 hour', hint: 'Rough time of day' },
  { value: 'unknown', label: "Don't know", hint: 'House-based statements will be left out' },
];

function Chips<T extends string>({
  name,
  value,
  options,
  onChange,
}: {
  name: string;
  value?: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 min-h-[44px] rounded-xl text-sm font-medium border transition-colors
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${
                        value === o.value
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-white/[0.04] text-slate-200 border-white/10 hover:border-white/25'
                      }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function GenderField({ value, onChange }: { value?: Gender; onChange: (v: Gender) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-white/70">
        Gender <span className="text-white/40">(optional — used by one Nadi rule)</span>
      </p>
      <Chips name="Gender" value={value} options={GENDER_OPTIONS} onChange={onChange} />
    </div>
  );
}

export function BirthTimeAccuracyField({
  value,
  onChange,
}: {
  value?: BirthTimeAccuracy;
  onChange: (v: BirthTimeAccuracy) => void;
}) {
  const hint = ACCURACY_OPTIONS.find((o) => o.value === value)?.hint;
  return (
    <div className="space-y-2">
      <p className="text-sm text-white/70">How sure are you of the birth time?</p>
      <Chips name="Birth time accuracy" value={value} options={ACCURACY_OPTIONS} onChange={onChange} />
      {hint && <p className="text-xs text-white/50">{hint}</p>}
    </div>
  );
}
