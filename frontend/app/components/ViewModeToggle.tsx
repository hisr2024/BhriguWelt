'use client';

import { useViewMode, type AppViewMode } from '@/lib/viewMode';

const LABELS: Record<AppViewMode, string> = { layman: 'Simple', astrologer: 'Astrologer' };

/** Simple / Astrologer switch. The choice applies across the whole app. */
export function ViewModeToggle({ className = '' }: { className?: string }) {
  const { mode, setMode } = useViewMode();
  return (
    <div role="tablist" aria-label="View" className={`inline-flex rounded-full border border-[color:var(--line)] p-0.5 ${className}`}>
      {(['layman', 'astrologer'] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="tab"
          aria-selected={mode === m}
          onClick={() => setMode(m)}
          className={`h-9 rounded-full px-3.5 text-sm transition-colors ${
            mode === m ? 'bg-[rgba(212,175,95,0.16)] text-gold-200' : 'text-ivory-2 hover:text-ivory'
          }`}
        >
          {LABELS[m]}
        </button>
      ))}
    </div>
  );
}

export default ViewModeToggle;
