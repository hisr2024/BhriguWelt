import { useCallback, useEffect, useState } from 'react';
import type { Profile, BirthDetails, PredictionResult, BhriguPrediction } from '@/lib/types';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';

const PROFILE_HASH_PREFIX = 'profile_hash_';
const PREDICTION_CACHE_PREFIX = 'bhrigu_prediction_';

interface ErrorDetails {
  code?: string;
  action: string;
  isNetwork: boolean;
  message: string;
}

interface UseBhriguPredictionArgs {
  category: string;
  fetchPrediction: (
    profileData: BirthDetails & { question?: string; force_regenerate?: boolean }
  ) => Promise<PredictionResult>;
  profile: Profile | null;
}

const hasRequiredProfileFields = (profile: Profile): boolean => {
  // Latitude and longitude are now optional - backend will geocode if not provided
  return Boolean(
    profile.dateOfBirth &&
      profile.timeOfBirth &&
      profile.placeOfBirth
  );
};

const getProfileHashKey = (profile: Profile) => `${PROFILE_HASH_PREFIX}${profile.id ?? 'current'}`;

const getPredictionCacheKey = (profile: Profile, category: string, question: string) => {
  const questionKey = question.trim() === '' ? 'default' : encodeURIComponent(question.trim());
  return `${PREDICTION_CACHE_PREFIX}${profile.id ?? 'current'}_${category}_${questionKey}`;
};

const clearCachedPredictions = (profile: Profile) => {
  if (typeof window === 'undefined') return;
  const prefix = `${PREDICTION_CACHE_PREFIX}${profile.id ?? 'current'}_`;
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
};

const getProfileHash = async (profile: Profile) => {
  const profilePayload = JSON.stringify({
    id: profile.id ?? null,
    name: profile.name ?? '',
    dateOfBirth: profile.dateOfBirth ?? '',
    timeOfBirth: profile.timeOfBirth ?? '',
    placeOfBirth: profile.placeOfBirth ?? '',
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
  });
  const encoder = new TextEncoder();
  const data = encoder.encode(profilePayload);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const useBhriguPrediction = ({
  category,
  fetchPrediction,
  profile
}: UseBhriguPredictionArgs) => {
  const [prediction, setPrediction] = useState<BhriguPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [question, setQuestion] = useState('');
  const [profileUpdated, setProfileUpdated] = useState(false);

  const loadPrediction = useCallback(async (
    forceRegenerate = false,
    profileHash?: string
  ) => {
    if (!profile) return;

    if (!hasRequiredProfileFields(profile)) {
      setError('Please complete your birth details in your profile to generate predictions.');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setFromCache(false);

    try {
      const resolvedHash = profileHash ?? await getProfileHash(profile);
      const cacheKey = getPredictionCacheKey(profile, category, question);
      const cached = typeof window === 'undefined' ? null : localStorage.getItem(cacheKey);

      if (!forceRegenerate && cached) {
        try {
          const parsed = JSON.parse(cached) as { profileHash: string; prediction: BhriguPrediction };
          if (parsed.profileHash === resolvedHash) {
            setPrediction(parsed.prediction);
            setFromCache(true);
            setLoading(false);
            return;
          }
          localStorage.removeItem(cacheKey);
        } catch (parseError) {
          localStorage.removeItem(cacheKey);
        }
      }

      if (forceRegenerate && typeof window !== 'undefined') {
        localStorage.removeItem(cacheKey);
      }

      const profileData = {
        date_of_birth: profile.dateOfBirth,
        time_of_birth: profile.timeOfBirth,
        place_of_birth: profile.placeOfBirth,
        latitude: profile.latitude,
        longitude: profile.longitude,
        question: question || undefined,
        force_regenerate: forceRegenerate
      };

      const response = await fetchPrediction(profileData);
      const normalized = normalizePredictionResponse<BhriguPrediction>(response);

      if (normalized.status === 'success') {
        setPrediction(normalized.prediction);
        setFromCache(Boolean(
          normalized.metadata?.from_cache ||
          normalized.metadata?.source === 'cache' ||
          normalized.message?.toLowerCase()?.includes('cache')
        ));
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              profileHash: resolvedHash,
              prediction: normalized.prediction,
            })
          );
        }
      } else {
        setError(normalized.message || 'Failed to generate prediction');
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
      const message = apiMessage || err?.message || 'An error occurred';
      const isNetwork = !err?.response;
      const code = status ? `HTTP ${status}` : err?.code || err?.name;
      const action = isNetwork
        ? 'Check your connection, then retry or use cached data.'
        : status && status >= 500
          ? 'Server hiccup detected. Retry soon or use cached data if available.'
          : 'Review your inputs and retry, or use cached data if available.';

      setError(message);
      setErrorDetails({
        code,
        action,
        isNetwork,
        message
      });
    } finally {
      setLoading(false);
    }
  }, [category, fetchPrediction, profile, question]);

  useEffect(() => {
    if (!profile || typeof window === 'undefined') {
      return;
    }

    const checkProfile = async () => {
      const currentHash = await getProfileHash(profile);
      const hashKey = getProfileHashKey(profile);
      const storedHash = localStorage.getItem(hashKey);
      const hasChanged = Boolean(storedHash && storedHash !== currentHash);

      if (hasChanged) {
        clearCachedPredictions(profile);
      }

      localStorage.setItem(hashKey, currentHash);
      setProfileUpdated(hasChanged);
      await loadPrediction(hasChanged, currentHash);
    };

    checkProfile();
  }, [loadPrediction, profile]);

  return {
    prediction,
    loading,
    error,
    errorDetails,
    fromCache,
    question,
    setQuestion,
    profileUpdated,
    loadPrediction,
  };
};
