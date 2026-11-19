'use client';

/**
 * Birth-place field with suggestions as you type (cities, towns and villages).
 *
 * The Lagna depends on the exact place, and many places share a name, so the
 * user picks one suggestion; its coordinates and time zone are then used for
 * the chart. Typing again clears the choice.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { astrologyAPI, type PlaceMatch } from '@/lib/api';

export function formatPlaceDetail(m: PlaceMatch): string {
  const lat = `${Math.abs(m.latitude).toFixed(2)}°${m.latitude >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(m.longitude).toFixed(2)}°${m.longitude >= 0 ? 'E' : 'W'}`;
  const zone = [m.timezone, m.utc_offset && `${m.utc_offset} at the birth time`].filter(Boolean).join(' · ');
  return [`${lat}, ${lon}`, zone].filter(Boolean).join(' · ');
}

type Props = {
  id: string;
  value: string;
  onTextChange: (text: string) => void;
  chosen: PlaceMatch | null;
  onChoose: (place: PlaceMatch | null) => void;
  date?: string;
  time?: string;
  autoFocus?: boolean;
  placeholder?: string;
};

export default function PlaceSearchField({ id, value, onTextChange, chosen, onChoose, date, time, autoFocus, placeholder }: Props) {
  const [suggestions, setSuggestions] = useState<PlaceMatch[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(-1);
  const latest = useRef(0);
  const listId = useId();

  useEffect(() => {
    const q = value.trim();
    if (chosen || q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const ticket = ++latest.current;
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        const found = await astrologyAPI.searchPlaces(q, date, time, true);
        if (ticket !== latest.current) return; // a newer keystroke won
        setSuggestions(found);
        setActive(found.length ? 0 : -1);
        setOpen(true);
      } catch {
        if (ticket === latest.current) {
          setFailed(true);
          setOpen(true);
        }
      } finally {
        if (ticket === latest.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, chosen, date, time]);

  const pick = (place: PlaceMatch) => {
    onChoose(place);
    onTextChange(place.name);
    setOpen(false);
  };

  if (chosen) {
    return (
      <div className="rounded-xl border border-gold-400/60 bg-[rgba(212,175,95,0.08)] px-4 py-3 text-sm" data-testid="chosen-place">
        <p className="text-[0.7rem] uppercase tracking-[0.14em] text-gold-300">Chart will be cast for</p>
        <p className="mt-1 text-ivory">{chosen.name}</p>
        <p className="mt-0.5 text-xs text-ivory-muted">{formatPlaceDetail(chosen)}</p>
        <button type="button" onClick={() => onChoose(null)} className="mt-2 min-h-[32px] text-xs text-gold-300 underline">
          Change place
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        required
        placeholder={placeholder || 'Start typing your birth town or village'}
        autoComplete="off"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onTextChange(e.target.value)}
        onFocus={() => suggestions.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !suggestions.length) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, suggestions.length - 1)); }
          if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(suggestions[active]!); }
          if (e.key === 'Escape') setOpen(false);
        }}
        className="nadi-input text-lg"
      />
      {loading && <p className="mt-2 text-xs text-ivory-muted" aria-live="polite">Searching places…</p>}
      {open && !loading && (
        <ul id={listId} role="listbox" className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-[color:var(--line)] bg-ink-raised">
          {suggestions.map((m, i) => (
            <li key={`${m.latitude},${m.longitude}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(m)}
                className={`w-full px-4 py-3 text-left text-sm ${i === active ? 'bg-[rgba(212,175,95,0.12)]' : ''} hover:bg-[rgba(212,175,95,0.12)]`}
              >
                <span className="block text-ivory">{m.name}</span>
                <span className="mt-0.5 block text-xs text-ivory-muted">{formatPlaceDetail(m)}</span>
              </button>
            </li>
          ))}
          {!suggestions.length && (
            <li className="px-4 py-3 text-sm text-ivory-2">
              {failed
                ? 'Place search is not reachable right now. Try again, or enter latitude and longitude below.'
                : 'No place found. Check the spelling, or add the district or state.'}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
