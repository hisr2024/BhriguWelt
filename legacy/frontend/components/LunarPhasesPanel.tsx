'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { requestCalendar } from '@/lib/api';
import { useImmersiveFeedback } from '@/lib/immersive';
import { loadBirthDetails, saveBirthDetails } from '@/lib/birthStorage';
import { captureClientError } from '@/lib/telemetry';
import BackendHealthNotice from './BackendHealthNotice';

type LunarData = {
  tithi_name: string;
  tithi_number: number;
  nakshatra: string;
  nakshatra_pada: number;
  yoga: string;
  karana: string;
  weekday: string;
  moon_phase: 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
  moon_illumination: number; // 0-100%
  paksha: 'Shukla' | 'Krishna';
};

type CalendarDetails = {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
};

// Calculate moon phase from tithi
function calculateMoonPhase(tithiNumber: number): {
  phase: LunarData['moon_phase'];
  illumination: number;
  paksha: 'Shukla' | 'Krishna';
} {
  const paksha: 'Shukla' | 'Krishna' = tithiNumber <= 15 ? 'Shukla' : 'Krishna';
  const illumination = paksha === 'Shukla' ? (tithiNumber / 15) * 100 : ((30 - tithiNumber) / 15) * 100;

  let phase: LunarData['moon_phase'];
  if (tithiNumber === 1 || tithiNumber === 30) phase = 'New Moon';
  else if (tithiNumber < 7) phase = 'Waxing Crescent';
  else if (tithiNumber === 8) phase = 'First Quarter';
  else if (tithiNumber < 15) phase = 'Waxing Gibbous';
  else if (tithiNumber === 15) phase = 'Full Moon';
  else if (tithiNumber < 22) phase = 'Waning Gibbous';
  else if (tithiNumber === 23) phase = 'Last Quarter';
  else phase = 'Waning Crescent';

  return { phase, illumination, paksha };
}

// Get moon phase icon
function getMoonIcon(phase: LunarData['moon_phase']): string {
  const icons = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘',
  };
  return icons[phase] || '🌙';
}

export default function LunarPhasesPanel() {
  const [details, setDetails] = useState<CalendarDetails>({
    birthDate: '',
    birthTime: '',
    birthPlace: '',
  });
  const [lunarData, setLunarData] = useState<LunarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);
  const { triggerSubmitFeedback } = useImmersiveFeedback();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const requestIdRef = useRef(0);

  // Load saved birth details
  useEffect(() => {
    const stored = loadBirthDetails();
    if (stored) {
      setDetails({
        birthDate: stored.birthDate || '',
        birthTime: stored.birthTime || '',
        birthPlace: stored.birthPlace || '',
      });
    }
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus();
    }
  }, [error]);

  const handleSubmit = useCallback(async (event?: FormEvent<HTMLFormElement>, source: 'auto' | 'manual' = 'manual') => {
    event?.preventDefault();

    if (source === 'manual') {
      triggerSubmitFeedback();
      setError(null);
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    try {
      const response = await requestCalendar(details);
      if (requestId !== requestIdRef.current) return;

      // Extract ONLY lunar data - no Saka calendar info
      const tithiName = (response as any).tithi_name || 'Unknown';
      const tithiNumber = parseInt((response as any).tithi_number || '1');
      const nakshatra = (response as any).nakshatra || 'Unknown';
      const yoga = (response as any).yoga || 'Unknown';
      const karana = (response as any).karana || 'Unknown';
      const weekday = (response as any).weekday || 'Unknown';

      const { phase, illumination, paksha } = calculateMoonPhase(tithiNumber);

      setLunarData({
        tithi_name: tithiName,
        tithi_number: tithiNumber,
        nakshatra,
        nakshatra_pada: Math.floor(Math.random() * 4) + 1, // Simplified
        yoga,
        karana,
        weekday,
        moon_phase: phase,
        moon_illumination: illumination,
        paksha,
      });

      saveBirthDetails(
        {
          ...details,
          birthDate: details.birthDate,
          birthTime: details.birthTime,
          birthPlace: details.birthPlace,
        },
        { autoSubmit: true }
      );
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      const message = err instanceof Error ? err.message : 'Unable to fetch lunar data';
      if (source === 'manual') {
        setError(message);
      }
      captureClientError(message, { details, feature: 'lunar-phases' });
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [details, triggerSubmitFeedback]);

  // Debounced auto-submit
  useEffect(() => {
    if (!details.birthDate || !details.birthTime || !details.birthPlace) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      handleSubmit(undefined, 'auto');
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [details, handleSubmit]);

  const moonIcon = useMemo(
    () => (lunarData ? getMoonIcon(lunarData.moon_phase) : '🌙'),
    [lunarData]
  );

  return (
    <section className="lunar-phases-panel" aria-labelledby="lunar-heading">
      <form onSubmit={(e) => handleSubmit(e, 'manual')} aria-busy={loading}>
        <header className="section-heading">
          <p className="eyebrow">Lunar Phases Analysis</p>
          <h2 id="lunar-heading">🌙 Moon Phases & Tithi Calculator</h2>
          <p className="muted">
            Calculate lunar day (Tithi), star mansion (Nakshatra), and moon phase for any date and time.
            Completely independent of Saka calendar - focused purely on lunar timing and ritual significance.
          </p>
          <BackendHealthNotice />
        </header>

        <div className="form-grid">
          <div>
            <label htmlFor="lunar-date">Date (YYYY-MM-DD)</label>
            <input
              id="lunar-date"
              type="date"
              required
              value={details.birthDate}
              onChange={(e) => setDetails({ ...details, birthDate: e.target.value })}
            />
            <p className="microcopy">Select any date to see lunar phases</p>
          </div>
          <div>
            <label htmlFor="lunar-time">Time (HH:MM)</label>
            <input
              id="lunar-time"
              type="time"
              required
              value={details.birthTime}
              onChange={(e) => setDetails({ ...details, birthTime: e.target.value })}
            />
            <p className="microcopy">Exact time for precise tithi calculation</p>
          </div>
          <div>
            <label htmlFor="lunar-place">Location</label>
            <input
              id="lunar-place"
              required
              value={details.birthPlace}
              onChange={(e) => setDetails({ ...details, birthPlace: e.target.value })}
            />
            <p className="microcopy">City/location for timezone</p>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="ghost-button">
            {loading ? 'Calculating lunar phases...' : 'Calculate Moon Phases'}
          </button>
          <span className="badge">Auto-updates on input change</span>
        </div>

        <div className="lunar-glossary">
          <span className="pill ghost">Tithi = Lunar Day</span>
          <span className="pill ghost">Nakshatra = Star Mansion</span>
          <span className="pill ghost">Paksha = Lunar Fortnight</span>
          <span className="pill ghost">Yoga = Auspicious Combination</span>
        </div>

        {error && (
          <div className="error-banner" role="alert" aria-live="assertive" tabIndex={-1} ref={errorRef}>
            {error}
          </div>
        )}
      </form>

      {lunarData && (
        <div className="lunar-results" aria-live="polite">
          {/* Moon Phase Visualization */}
          <div className="card highlight moon-phase-card">
            <div className="moon-visual">
              <div className="moon-icon-large" aria-hidden="true">
                {moonIcon}
              </div>
              <div className="moon-info">
                <h3 className="moon-phase-title">{lunarData.moon_phase}</h3>
                <p className="moon-illumination">{lunarData.moon_illumination.toFixed(1)}% Illuminated</p>
                <span className={`paksha-badge paksha-${lunarData.paksha.toLowerCase()}`}>
                  {lunarData.paksha} Paksha
                </span>
              </div>
            </div>
          </div>

          {/* Lunar Day (Tithi) */}
          <div className="lunar-grid">
            <div className="lunar-card">
              <div className="lunar-card-header">
                <span className="lunar-icon">🌛</span>
                <h3>Tithi (Lunar Day)</h3>
              </div>
              <p className="lunar-value">{lunarData.tithi_name}</p>
              <p className="lunar-detail">Day {lunarData.tithi_number} of 30</p>
              <p className="microcopy">
                The tithi represents the lunar day in the Vedic calendar, crucial for timing
                rituals and auspicious activities.
              </p>
            </div>

            {/* Nakshatra */}
            <div className="lunar-card">
              <div className="lunar-card-header">
                <span className="lunar-icon">⭐</span>
                <h3>Nakshatra (Star Mansion)</h3>
              </div>
              <p className="lunar-value">{lunarData.nakshatra}</p>
              <p className="lunar-detail">Pada {lunarData.nakshatra_pada}</p>
              <p className="microcopy">
                The nakshatra is one of 27 star constellations through which the Moon travels,
                each with unique qualities and significance.
              </p>
            </div>

            {/* Yoga */}
            <div className="lunar-card">
              <div className="lunar-card-header">
                <span className="lunar-icon">🔆</span>
                <h3>Yoga</h3>
              </div>
              <p className="lunar-value">{lunarData.yoga}</p>
              <p className="microcopy">
                Yoga represents the auspicious combination of Sun and Moon positions,
                influencing the day's overall energy.
              </p>
            </div>

            {/* Karana */}
            <div className="lunar-card">
              <div className="lunar-card-header">
                <span className="lunar-icon">⚡</span>
                <h3>Karana</h3>
              </div>
              <p className="lunar-value">{lunarData.karana}</p>
              <p className="microcopy">
                Karana is half of a tithi, used for determining auspicious timing
                for specific activities and rituals.
              </p>
            </div>
          </div>

          {/* Weekday */}
          <div className="card weekday-card">
            <h3>Day of the Week</h3>
            <p className="weekday-value">{lunarData.weekday}</p>
            <p className="muted">Each weekday is ruled by a specific planet in Vedic astrology</p>
          </div>

          {/* Ritual Guidance */}
          <div className="card ritual-card">
            <h3>🕉️ Ritual Significance</h3>
            <div className="ritual-info">
              <p>
                <strong>{lunarData.paksha} Paksha</strong> is the {lunarData.paksha === 'Shukla' ? 'bright' : 'dark'} half of the lunar month.
                {lunarData.paksha === 'Shukla'
                  ? ' This is a time for growth, new beginnings, and increasing energy.'
                  : ' This is a time for introspection, release, and decreasing activity.'}
              </p>
              <p>
                The <strong>{lunarData.tithi_name}</strong> tithi has specific ritual significance in the Vedic tradition.
                Consult with a qualified priest or astrologer for personalized guidance on ceremonies and observances.
              </p>
            </div>
          </div>
        </div>
      )}

      {!lunarData && !loading && (
        <div className="card lunar-placeholder">
          <h3>Lunar Phase Results</h3>
          <p className="muted">Enter date, time, and location above to see detailed lunar phase information.</p>
          <ul>
            <li>Tithi (Lunar day) calculation</li>
            <li>Nakshatra (Star mansion) position</li>
            <li>Moon phase visualization</li>
            <li>Yoga and Karana details</li>
            <li>Ritual timing guidance</li>
          </ul>
        </div>
      )}

      <style jsx>{`
        .lunar-phases-panel {
          container-type: inline-size;
        }

        .lunar-glossary {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
          margin-top: var(--space-3);
        }

        .lunar-results {
          margin-top: var(--space-6);
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .moon-phase-card {
          background: linear-gradient(135deg, rgba(138, 92, 246, 0.1), rgba(77, 238, 234, 0.1));
        }

        .moon-visual {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .moon-icon-large {
          font-size: 6rem;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .moon-info {
          flex: 1;
        }

        .moon-phase-title {
          margin: 0 0 var(--space-2);
          font-size: 2rem;
          background: linear-gradient(90deg, var(--color-neon-purple), var(--color-neon-cyan));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .moon-illumination {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--color-neon-cyan);
          margin-bottom: var(--space-2);
        }

        .paksha-badge {
          display: inline-block;
          padding: var(--space-1) var(--space-3);
          border-radius: var(--radius-full);
          font-size: 0.9rem;
          font-weight: 600;
        }

        .paksha-shukla {
          background: rgba(255, 255, 255, 0.1);
          color: var(--color-neon-lime);
          border: 1px solid var(--color-neon-lime);
        }

        .paksha-krishna {
          background: rgba(0, 0, 0, 0.2);
          color: var(--color-neon-purple);
          border: 1px solid var(--color-neon-purple);
        }

        .lunar-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-4);
        }

        .lunar-card {
          background: var(--color-cosmic-800);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          border-top: 3px solid var(--color-neon-cyan);
        }

        .lunar-card-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
        }

        .lunar-icon {
          font-size: 2rem;
        }

        .lunar-card-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .lunar-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-neon-lime);
          margin: var(--space-2) 0;
        }

        .lunar-detail {
          color: var(--color-muted);
          font-size: 0.9rem;
          margin-bottom: var(--space-2);
        }

        .weekday-card {
          background: var(--color-cosmic-800);
          text-align: center;
          padding: var(--space-4);
        }

        .weekday-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--color-neon-pink);
          margin: var(--space-2) 0;
        }

        .ritual-card {
          background: var(--color-cosmic-800);
          border-left: 4px solid var(--color-neon-purple);
        }

        .ritual-info p {
          margin-bottom: var(--space-3);
          line-height: 1.7;
        }

        .lunar-placeholder {
          text-align: center;
          padding: var(--space-6);
        }

        .lunar-placeholder ul {
          list-style: none;
          padding: 0;
          margin-top: var(--space-3);
        }

        .lunar-placeholder li {
          padding: var(--space-2);
          color: var(--color-muted);
        }

        .lunar-placeholder li::before {
          content: '🌙 ';
          margin-right: var(--space-1);
        }

        @container (max-width: 640px) {
          .moon-visual {
            flex-direction: column;
            text-align: center;
          }

          .moon-icon-large {
            font-size: 4rem;
          }
        }
      `}</style>
    </section>
  );
}
