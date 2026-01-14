'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { birthChartAPI } from '@/lib/api';
import { SkeletonCard } from '@/components/LoadingStates';

interface BirthChartFormProps {
  defaultTimezone?: string;
}

interface BirthChartResponse {
  profile: Record<string, any>;
  chart: Record<string, any>;
  interpretation: {
    summary: string;
    sections: Array<{ title: string; text: string; score: number }>;
    placements?: Record<string, string>;
    confidence: number;
  };
  metadata?: Record<string, any>;
}

const DEFAULT_OPTIONS = {
  detailed_interpretation: true,
  include_remedies: false,
  language: 'en',
};

const createStorageId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `chart-${Date.now()}`;
};

const storeChart = (id: string, payload: BirthChartResponse) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`birthchart:${id}`, JSON.stringify(payload));
    window.localStorage.setItem('birthchart:last', id);
  } catch (error) {
    console.warn('Failed to cache birth chart', error);
  }
};

export default function BirthChartForm({ defaultTimezone }: BirthChartFormProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unknownTime, setUnknownTime] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    time: '',
    timezone: defaultTimezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    latitude: '',
    longitude: '',
    placeName: '',
    houseSystem: 'Placidus',
  });

  const today = new Date().toISOString().split('T')[0];
  const validateName = (value: string) => !value || (value.trim().length >= 2 && value.trim().length <= 80);
  const validateDate = (value: string) => Boolean(value) && value >= '1900-01-01' && value <= today;
  const validateTime = (value: string) => !value || /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
  const validateCoordinates = (value: string, min: number, max: number) => {
    if (!value) return false;
    const numeric = Number(value);
    return !Number.isNaN(numeric) && numeric >= min && numeric <= max;
  };

  const canContinue = useMemo(() => {
    if (step === 1) {
      return Boolean(formData.dob && validateDate(formData.dob) && validateName(formData.name));
    }
    if (step === 2) {
      const hasLocation = Boolean(formData.latitude && formData.longitude) || Boolean(formData.placeName);
      const timeOk = unknownTime || validateTime(formData.time);
      return Boolean(formData.timezone && hasLocation && timeOk);
    }
    return true;
  }, [formData, step, unknownTime]);

  const handleSubmit = async () => {
    setError(null);
    if (!validateName(formData.name)) {
      setError('Please enter a valid name (2-80 characters).');
      return;
    }
    if (!validateDate(formData.dob)) {
      setError('Please enter a valid date of birth.');
      return;
    }
    if (!formData.timezone) {
      setError('Please provide your timezone.');
      return;
    }
    if (!unknownTime && !validateTime(formData.time)) {
      setError('Please enter a valid birth time.');
      return;
    }
    if (!formData.placeName && (!formData.latitude || !formData.longitude)) {
      setError('Provide a place name or coordinates for accurate charts.');
      return;
    }
    if (formData.latitude && !validateCoordinates(formData.latitude, -90, 90)) {
      setError('Latitude must be between -90 and 90.');
      return;
    }
    if (formData.longitude && !validateCoordinates(formData.longitude, -180, 180)) {
      setError('Longitude must be between -180 and 180.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name || undefined,
        dob: formData.dob,
        time: unknownTime ? undefined : formData.time || undefined,
        time_unknown: unknownTime,
        timezone: formData.timezone,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        place_name: formData.placeName || undefined,
        house_system: formData.houseSystem,
        options: DEFAULT_OPTIONS,
      };

      const response = await birthChartAPI.compute(payload);
      const id = createStorageId();
      storeChart(id, response);
      router.push(`/birthchart/${id}`);
    } catch (err: any) {
      setError(err?.message || 'Unable to compute your birth chart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/60">Step {step} of 3</p>
          <h1 className="text-2xl font-semibold text-white">Create your birth chart</h1>
        </div>
        <button
          type="button"
          className="min-h-[44px] rounded-full border border-white/20 px-4 text-sm text-white hover:border-white/40"
          onClick={() => router.push('/dashboard')}
        >
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <SkeletonCard />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/70" htmlFor="name">
                  Name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-white focus:border-purple-400 focus:outline-none"
                  aria-label="Name"
                />
              </div>
              <div>
                <label className="text-sm text-white/70" htmlFor="dob">
                  Date of birth
                </label>
                <input
                  id="dob"
                  type="date"
                  value={formData.dob}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, dob: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-white focus:border-purple-400 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-purple-400/40 bg-purple-500/10 p-4 text-sm text-purple-100">
                <p className="font-medium">Don&apos;t know your birth time?</p>
                <p className="mt-1 text-white/70">
                  You can continue without it. We&apos;ll use noon as a default and flag the
                  chart as lower confidence. You can recompute later.
                </p>
                <label className="mt-3 flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={unknownTime}
                    onChange={(event) => setUnknownTime(event.target.checked)}
                    className="h-5 w-5 accent-purple-500"
                  />
                  I don&apos;t know my birth time
                </label>
              </div>

              {!unknownTime && (
                <div>
                  <label className="text-sm text-white/70" htmlFor="time">
                    Time of birth
                  </label>
                  <input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, time: event.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-white focus:border-purple-400 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-sm text-white/70" htmlFor="timezone">
                  Timezone
                </label>
                <input
                  id="timezone"
                  type="text"
                  value={formData.timezone}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, timezone: event.target.value }))
                  }
                  placeholder="Asia/Kolkata"
                  className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-white focus:border-purple-400 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/70" htmlFor="place">
                  Place name (optional)
                </label>
                <input
                  id="place"
                  type="text"
                  value={formData.placeName}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, placeName: event.target.value }))
                  }
                  placeholder="City, Country"
                  className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-white focus:border-purple-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-white/70" htmlFor="lat">
                    Latitude
                  </label>
                  <input
                    id="lat"
                    type="number"
                    value={formData.latitude}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, latitude: event.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-white focus:border-purple-400 focus:outline-none"
                    aria-label="Latitude"
                  />
                </div>
                <div>
                  <label className="text-sm text-white/70" htmlFor="lng">
                    Longitude
                  </label>
                  <input
                    id="lng"
                    type="number"
                    value={formData.longitude}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, longitude: event.target.value }))
                    }
                    className="mt-2 w-full rounded-xl border border-white/20 bg-transparent px-4 py-3 text-white focus:border-purple-400 focus:outline-none"
                    aria-label="Longitude"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/70" htmlFor="houseSystem">
                  House system
                </label>
                <select
                  id="houseSystem"
                  value={formData.houseSystem}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, houseSystem: event.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-white/20 bg-gray-900 px-4 py-3 text-white focus:border-purple-400 focus:outline-none"
                >
                  <option value="Placidus">Placidus</option>
                  <option value="Whole Sign">Whole Sign</option>
                  <option value="Koch">Koch</option>
                  <option value="Porphyry">Porphyry</option>
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {step > 1 && (
              <button
                type="button"
                className="min-h-[44px] flex-1 rounded-full border border-white/20 px-4 py-2 text-white hover:border-white/40"
                onClick={() => setStep((prev) => prev - 1)}
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                className="min-h-[44px] flex-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-white shadow-lg disabled:opacity-50"
                onClick={() => setStep((prev) => prev + 1)}
                disabled={!canContinue}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="min-h-[44px] flex-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-white shadow-lg"
                onClick={handleSubmit}
              >
                Generate Birth Chart
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
