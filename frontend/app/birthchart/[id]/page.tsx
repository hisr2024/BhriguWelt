'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useParams } from 'next/navigation';
import { SkeletonCard } from '@/components/LoadingStates';

const BirthChartWheel = dynamic(() => import('@/components/BirthChartWheel'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
      Loading natal wheel…
    </div>
  ),
});

interface ChartResponse {
  profile: Record<string, any>;
  chart: {
    datetime_utc: string;
    timezone: string;
    ascendant?: { sign: string; degree: number; house: number } | null;
    planets: Record<string, { sign: string; degree: number; longitude: number; house?: number }>;
    houses?: Array<{ house: number; degree: number; sign: string }> | null;
    elements?: Record<string, number>;
    nakshatra?: string;
  };
  interpretation: {
    summary: string;
    sections: Array<{ title: string; text: string; score: number }>;
    placements?: Record<string, string>;
    confidence: number;
  };
  metadata?: Record<string, any>;
}

const loadChart = (id: string): ChartResponse | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(`birthchart:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ChartResponse;
  } catch (error) {
    console.warn('Failed to parse cached chart', error);
    return null;
  }
};

export default function BirthChartResultPage() {
  const router = useRouter();
  const params = useParams();
  const chartId = Array.isArray(params?.id) ? params?.id[0] : params?.id;
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!chartId) return;
    const cached = loadChart(chartId);
    if (cached) {
      setChart(cached);
      setLoading(false);
      return;
    }
    const lastId = window.localStorage.getItem('birthchart:last');
    if (lastId) {
      const fallback = loadChart(lastId);
      if (fallback) {
        setChart(fallback);
        setLoading(false);
        setError('Showing your last saved chart because this one was not found offline.');
        return;
      }
    }
    setError('We could not find this chart offline. Please recompute.');
    setLoading(false);
  }, [chartId]);

  useEffect(() => {
    if (selectedPlanet) {
      closeButtonRef.current?.focus();
    }
  }, [selectedPlanet]);

  const planets = useMemo(() => chart?.chart?.planets ?? {}, [chart]);
  const planetKeys = useMemo(() => Object.keys(planets), [planets]);
  const selectedPlacement = selectedPlanet && chart?.interpretation?.placements
    ? chart.interpretation.placements[selectedPlanet]
    : null;

  const handleExport = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = async () => {
    if (!chart) return;
    const shareData = {
      title: 'My Birth Chart',
      text: chart.interpretation.summary,
      url: window.location.href,
    };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      alert('Link copied to clipboard.');
    }
  };

  const handleSaveOffline = () => {
    if (typeof window === 'undefined' || !chartId || !chart) return;
    try {
      window.localStorage.setItem(`birthchart:${chartId}`, JSON.stringify(chart));
      window.localStorage.setItem('birthchart:last', chartId);
      alert('Chart saved for offline access.');
    } catch (error) {
      console.warn('Failed to save chart offline', error);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-3xl space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </main>
    );
  }

  if (!chart) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-xl space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <h1 className="text-xl font-semibold">Chart unavailable</h1>
          <p className="text-sm text-white/70">{error}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className="min-h-[44px] flex-1 rounded-full border border-white/20 px-4 py-2 text-white"
              onClick={() => router.push('/birthchart/new')}
            >
              Try Again
            </button>
            <button
              type="button"
              className="min-h-[44px] flex-1 rounded-full border border-white/20 px-4 py-2 text-white"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        {error && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/60">Your cosmic snapshot</p>
              <h1 className="text-2xl font-semibold">{chart.profile?.name || 'Birth Chart'}</h1>
              <p className="text-sm text-white/70">
                Confidence {Math.round(chart.interpretation.confidence * 100)}% ·{' '}
                {chart.chart.nakshatra ? `Nakshatra ${chart.chart.nakshatra}` : 'Western + Vedic blend'}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleSaveOffline}
                className="min-h-[44px] rounded-full border border-white/20 px-4 text-sm text-white"
              >
                Save Offline
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="min-h-[44px] rounded-full border border-white/20 px-4 text-sm text-white"
              >
                Export PDF
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="min-h-[44px] rounded-full border border-white/20 px-4 text-sm text-white"
              >
                Share
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm text-white/80">{chart.interpretation.summary}</p>
        </section>

        {chart.profile?.time_unknown && (
          <section className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
            Birth time was unknown, so we used 12:00 for calculations. For higher accuracy,
            recompute with exact time when available.
            <button
              type="button"
              onClick={() => router.push('/birthchart/new')}
              className="mt-3 min-h-[44px] rounded-full border border-blue-300/50 px-4 text-blue-50"
            >
              Recompute with exact time
            </button>
          </section>
        )}

        <section className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Natal wheel</h2>
            {planetKeys.length > 0 ? (
              <div className="mt-4">
                <BirthChartWheel planets={planets} simplified={planetKeys.length > 8} />
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Natal wheel unavailable. Showing compact list instead.
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-semibold">Planets</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {planetKeys.map((planet) => (
                <button
                  key={planet}
                  type="button"
                  className="min-h-[44px] min-w-[44px] rounded-full border border-white/20 px-4 text-sm text-white hover:border-white/40"
                  onClick={() => setSelectedPlanet(planet)}
                  aria-label={`View ${planet} placement`}
                >
                  {planet.toUpperCase()}
                </button>
              ))}
            </div>
            {selectedPlanet && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
                role="presentation"
                onClick={() => setSelectedPlanet(null)}
              >
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${selectedPlanet} placement details`}
                  className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 text-sm text-white/80"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold">{selectedPlanet.toUpperCase()} Details</h3>
                    <button
                      type="button"
                      ref={closeButtonRef}
                      className="min-h-[44px] rounded-full px-3 text-white/70"
                      onClick={() => setSelectedPlanet(null)}
                      aria-label="Close planet details"
                    >
                      Close
                    </button>
                  </div>
                  <p className="mt-3">
                    {selectedPlacement || 'Placement insight will appear here once generated.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-4">
          {chart.interpretation.sections.map((section) => {
            const isOpen = openSections[section.title] ?? true;
            return (
              <div key={section.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <button
                  type="button"
                  className="flex min-h-[44px] w-full items-center justify-between text-left"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenSections((prev) => ({
                      ...prev,
                      [section.title]: !isOpen,
                    }))
                  }
                >
                  <span className="text-lg font-semibold">{section.title}</span>
                  <span className="text-sm text-white/60">Score {Math.round(section.score * 100)}%</span>
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm text-white/80">{section.text}</p>
                )}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
