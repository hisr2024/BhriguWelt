'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, Download, Share2, BookOpen } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { VariableSizeList } from 'react-window';
import type { Profile, BirthDetails, PredictionResult, BhriguPrediction } from '@/lib/types';
import { getCurrentLanguage, type Language } from '@/lib/copy';
import { tLocale } from '@/lib/locales';
import { Accordion } from '@/app/components/ui/Accordion';
import { AccordionItem } from '@/app/components/ui/AccordionItem';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';
import { useSectionExpansionStore } from '@/app/stores/sectionExpansionStore';

// Category-specific section configurations (moved outside component for performance)
const CATEGORY_SECTIONS: Record<string, Array<{ key: string; titleKey: string; color: string }>> = {
  'karmic-journey': [
    { key: 'soul_purpose', titleKey: "bhriguPrediction.sections.karmic-journey.soul_purpose", color: 'cyan' },
    { key: 'karmic_blueprint', titleKey: 'bhriguPrediction.sections.karmic-journey.karmic_blueprint', color: 'purple' },
    { key: 'evolution_stage', titleKey: 'bhriguPrediction.sections.karmic-journey.evolution_stage', color: 'blue' },
    { key: 'life_mission', titleKey: 'bhriguPrediction.sections.karmic-journey.life_mission', color: 'indigo' },
    { key: 'karmic_lessons', titleKey: 'bhriguPrediction.sections.karmic-journey.karmic_lessons', color: 'violet' },
    { key: 'soul_connections', titleKey: 'bhriguPrediction.sections.karmic-journey.soul_connections', color: 'pink' },
    { key: 'timing', titleKey: 'bhriguPrediction.sections.karmic-journey.timing', color: 'rose' },
    { key: 'spiritual_gifts', titleKey: 'bhriguPrediction.sections.karmic-journey.spiritual_gifts', color: 'amber' }
  ],
  'past-lives': [
    { key: 'recent_life', titleKey: 'bhriguPrediction.sections.past-lives.recent_life', color: 'cyan' },
    { key: 'significant_lives', titleKey: 'bhriguPrediction.sections.past-lives.significant_lives', color: 'purple' },
    { key: 'karmic_patterns', titleKey: 'bhriguPrediction.sections.past-lives.karmic_patterns', color: 'blue' },
    { key: 'past_skills', titleKey: 'bhriguPrediction.sections.past-lives.past_skills', color: 'indigo' },
    { key: 'traumas_healing', titleKey: 'bhriguPrediction.sections.past-lives.traumas_healing', color: 'violet' },
    { key: 'past_relationships', titleKey: 'bhriguPrediction.sections.past-lives.past_relationships', color: 'pink' },
    { key: 'karmic_debts', titleKey: 'bhriguPrediction.sections.past-lives.karmic_debts', color: 'rose' },
    { key: 'spiritual_progress', titleKey: 'bhriguPrediction.sections.past-lives.spiritual_progress', color: 'amber' }
  ],
  'future-lives': [
    { key: 'next_incarnation', titleKey: 'bhriguPrediction.sections.future-lives.next_incarnation', color: 'cyan' },
    { key: 'evolution_trajectory', titleKey: 'bhriguPrediction.sections.future-lives.evolution_trajectory', color: 'purple' },
    { key: 'final_birth_conditions', titleKey: 'bhriguPrediction.sections.future-lives.final_birth_conditions', color: 'blue' },
    { key: 'future_scenarios', titleKey: 'bhriguPrediction.sections.future-lives.future_scenarios', color: 'indigo' },
    { key: 'moksha_timeline', titleKey: 'bhriguPrediction.sections.future-lives.moksha_timeline', color: 'violet' },
    { key: 'higher_realms', titleKey: 'bhriguPrediction.sections.future-lives.higher_realms', color: 'pink' },
    { key: 'bodhisattva_path', titleKey: 'bhriguPrediction.sections.future-lives.bodhisattva_path', color: 'rose' },
    { key: 'ultimate_destiny', titleKey: 'bhriguPrediction.sections.future-lives.ultimate_destiny', color: 'amber' }
  ],
  'present-life': [
    { key: 'current_phase', titleKey: 'bhriguPrediction.sections.present-life.current_phase', color: 'cyan' },
    { key: 'career', titleKey: 'bhriguPrediction.sections.present-life.career', color: 'purple' },
    { key: 'relationships', titleKey: 'bhriguPrediction.sections.present-life.relationships', color: 'blue' },
    { key: 'health', titleKey: 'bhriguPrediction.sections.present-life.health', color: 'indigo' },
    { key: 'finances', titleKey: 'bhriguPrediction.sections.present-life.finances', color: 'violet' },
    { key: 'spiritual_growth', titleKey: 'bhriguPrediction.sections.present-life.spiritual_growth', color: 'pink' },
    { key: 'education', titleKey: 'bhriguPrediction.sections.present-life.education', color: 'rose' },
    { key: 'life_purpose', titleKey: 'bhriguPrediction.sections.present-life.life_purpose', color: 'amber' },
    { key: 'challenges', titleKey: 'bhriguPrediction.sections.present-life.challenges', color: 'orange' },
    { key: 'timing', titleKey: 'bhriguPrediction.sections.present-life.timing', color: 'teal' }
  ],
  'life-events': [
    { key: 'yearly_forecast', titleKey: 'bhriguPrediction.sections.life-events.yearly_forecast', color: 'cyan' },
    { key: 'marriage_timing', titleKey: 'bhriguPrediction.sections.life-events.marriage_timing', color: 'purple' },
    { key: 'career_milestones', titleKey: 'bhriguPrediction.sections.life-events.career_milestones', color: 'blue' },
    { key: 'children_family', titleKey: 'bhriguPrediction.sections.life-events.children_family', color: 'indigo' },
    { key: 'financial_events', titleKey: 'bhriguPrediction.sections.life-events.financial_events', color: 'violet' },
    { key: 'health_alerts', titleKey: 'bhriguPrediction.sections.life-events.health_alerts', color: 'pink' },
    { key: 'spiritual_milestones', titleKey: 'bhriguPrediction.sections.life-events.spiritual_milestones', color: 'rose' },
    { key: 'relocations', titleKey: 'bhriguPrediction.sections.life-events.relocations', color: 'amber' },
    { key: 'education', titleKey: 'bhriguPrediction.sections.life-events.education', color: 'orange' },
    { key: 'favorable_periods', titleKey: 'bhriguPrediction.sections.life-events.favorable_periods', color: 'teal' },
    { key: 'challenging_periods', titleKey: 'bhriguPrediction.sections.life-events.challenging_periods', color: 'red' },
    { key: 'transits', titleKey: 'bhriguPrediction.sections.life-events.transits', color: 'lime' },
    { key: 'age_milestones', titleKey: 'bhriguPrediction.sections.life-events.age_milestones', color: 'emerald' }
  ],
  'karmic-remedies': [
    { key: 'mantras', titleKey: 'bhriguPrediction.sections.karmic-remedies.mantras', color: 'cyan' },
    { key: 'gemstones', titleKey: 'bhriguPrediction.sections.karmic-remedies.gemstones', color: 'purple' },
    { key: 'yantras', titleKey: 'bhriguPrediction.sections.karmic-remedies.yantras', color: 'blue' },
    { key: 'charitable_activities', titleKey: 'bhriguPrediction.sections.karmic-remedies.charitable_activities', color: 'indigo' },
    { key: 'fasting', titleKey: 'bhriguPrediction.sections.karmic-remedies.fasting', color: 'violet' },
    { key: 'deity_worship', titleKey: 'bhriguPrediction.sections.karmic-remedies.deity_worship', color: 'pink' },
    { key: 'pilgrimage', titleKey: 'bhriguPrediction.sections.karmic-remedies.pilgrimage', color: 'rose' },
    { key: 'lifestyle', titleKey: 'bhriguPrediction.sections.karmic-remedies.lifestyle', color: 'amber' },
    { key: 'planetary_rituals', titleKey: 'bhriguPrediction.sections.karmic-remedies.planetary_rituals', color: 'orange' },
    { key: 'karmic_cleansing', titleKey: 'bhriguPrediction.sections.karmic-remedies.karmic_cleansing', color: 'teal' },
    { key: 'service', titleKey: 'bhriguPrediction.sections.karmic-remedies.service', color: 'lime' },
    { key: 'meditation', titleKey: 'bhriguPrediction.sections.karmic-remedies.meditation', color: 'emerald' }
  ],
  'relationships': [
    { key: 'romantic_marriage', titleKey: 'bhriguPrediction.sections.relationships.romantic_marriage', color: 'cyan' },
    { key: 'family', titleKey: 'bhriguPrediction.sections.relationships.family', color: 'purple' },
    { key: 'soul_connections', titleKey: 'bhriguPrediction.sections.relationships.soul_connections', color: 'blue' },
    { key: 'friendships', titleKey: 'bhriguPrediction.sections.relationships.friendships', color: 'indigo' },
    { key: 'professional', titleKey: 'bhriguPrediction.sections.relationships.professional', color: 'violet' },
    { key: 'karmic_patterns', titleKey: 'bhriguPrediction.sections.relationships.karmic_patterns', color: 'pink' },
    { key: 'communication', titleKey: 'bhriguPrediction.sections.relationships.communication', color: 'rose' },
    { key: 'timing', titleKey: 'bhriguPrediction.sections.relationships.timing', color: 'amber' },
    { key: 'healing', titleKey: 'bhriguPrediction.sections.relationships.healing', color: 'orange' },
    { key: 'healthy_practices', titleKey: 'bhriguPrediction.sections.relationships.healthy_practices', color: 'teal' }
  ],
  'predictions': [
    { key: 'daily', titleKey: 'bhriguPrediction.sections.predictions.daily', color: 'cyan' },
    { key: 'weekly', titleKey: 'bhriguPrediction.sections.predictions.weekly', color: 'purple' },
    { key: 'monthly', titleKey: 'bhriguPrediction.sections.predictions.monthly', color: 'blue' },
    { key: 'yearly', titleKey: 'bhriguPrediction.sections.predictions.yearly', color: 'indigo' }
  ]
};

// Color classes configuration (moved outside component for performance)
const COLOR_CLASSES: Record<string, { border: string; hover: string; accent: string; text: string }> = {
  cyan: { border: 'border-cyan-500/30', hover: 'hover:border-cyan-500/50', accent: 'from-cyan-400 to-cyan-600', text: 'text-cyan-400' },
  purple: { border: 'border-purple-500/30', hover: 'hover:border-purple-500/50', accent: 'from-purple-400 to-purple-600', text: 'text-purple-400' },
  blue: { border: 'border-blue-500/30', hover: 'hover:border-blue-500/50', accent: 'from-blue-400 to-blue-600', text: 'text-blue-400' },
  indigo: { border: 'border-indigo-500/30', hover: 'hover:border-indigo-500/50', accent: 'from-indigo-400 to-indigo-600', text: 'text-indigo-400' },
  violet: { border: 'border-violet-500/30', hover: 'hover:border-violet-500/50', accent: 'from-violet-400 to-violet-600', text: 'text-violet-400' },
  pink: { border: 'border-pink-500/30', hover: 'hover:border-pink-500/50', accent: 'from-pink-400 to-pink-600', text: 'text-pink-400' },
  rose: { border: 'border-rose-500/30', hover: 'hover:border-rose-500/50', accent: 'from-rose-400 to-rose-600', text: 'text-rose-400' },
  amber: { border: 'border-amber-500/30', hover: 'hover:border-amber-500/50', accent: 'from-amber-400 to-amber-600', text: 'text-amber-400' },
  orange: { border: 'border-orange-500/30', hover: 'hover:border-orange-500/50', accent: 'from-orange-400 to-orange-600', text: 'text-orange-400' },
  teal: { border: 'border-teal-500/30', hover: 'hover:border-teal-500/50', accent: 'from-teal-400 to-teal-600', text: 'text-teal-400' },
  red: { border: 'border-red-500/30', hover: 'hover:border-red-500/50', accent: 'from-red-400 to-red-600', text: 'text-red-400' },
  lime: { border: 'border-lime-500/30', hover: 'hover:border-lime-500/50', accent: 'from-lime-400 to-lime-600', text: 'text-lime-400' },
  emerald: { border: 'border-emerald-500/30', hover: 'hover:border-emerald-500/50', accent: 'from-emerald-400 to-emerald-600', text: 'text-emerald-400' }
};

// Default color for sections without a specific color mapping
const DEFAULT_COLOR = 'cyan';
const PROFILE_HASH_PREFIX = 'profile_hash_';
const PREDICTION_CACHE_PREFIX = 'bhrigu_prediction_';
const SKELETON_LINES = 5;
const ESTIMATED_SECTION_HEIGHT = 220;
const MAX_SECTION_LIST_HEIGHT = 700;

// Helper function to check if profile has required fields
const hasRequiredProfileFields = (profile: Profile): boolean => {
  return !!(
    profile.dateOfBirth &&
    profile.timeOfBirth &&
    profile.placeOfBirth &&
    profile.latitude != null &&
    profile.longitude != null
  );
};

// Helper function to normalize category keys
const normalizeCategoryKey = (category: string): string => {
  return category?.toLowerCase().replace(/[^a-z0-9-]/g, '-') || '';
};

type AnalysisWorkerResponse = {
  id: number;
  sections: Record<string, string>;
  error?: string;
  fromCache?: boolean;
};

interface BhriguPredictionViewProps {
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fetchPrediction: (
    profileData: BirthDetails & { question?: string; force_regenerate?: boolean }
  ) => Promise<PredictionResult>;
  profile: Profile | null;
}

interface NormalizedPrediction {
  sections: Record<string, string>;
  fullAnalysis: string;
  metadata?: BhriguPrediction['metadata'] & { category?: string };
}

interface DebugPredictionPayload {
  metadata?: BhriguPrediction['metadata'] & { category?: string };
  fullAnalysisLength: number;
  sectionKeys: string[];
  sectionLengths: Record<string, number>;
}

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

const normalizePrediction = (
  prediction: BhriguPrediction,
  fallbackCategory: string
): NormalizedPrediction => {
  const metadata = prediction.metadata ?? {};
  const categoryValue = metadata?.category ?? prediction.category ?? fallbackCategory;
  const normalizedCategory = normalizeCategoryKey(
    typeof categoryValue === 'string' ? categoryValue : fallbackCategory
  );
  const sectionsConfig = CATEGORY_SECTIONS[normalizedCategory] || [];
  const sections: Record<string, string> = {};

  sectionsConfig.forEach((section) => {
    const value = prediction[section.key as keyof BhriguPrediction];
    if (typeof value === 'string' && value.trim().length > 0) {
      sections[section.key] = value.trim();
    }
  });

  return {
    sections,
    fullAnalysis: prediction.full_analysis ?? prediction.complete_analysis ?? '',
    metadata: {
      ...metadata,
      category: normalizedCategory,
    },
  };
};

const buildDebugPayload = (prediction: NormalizedPrediction): DebugPredictionPayload => {
  const sectionLengths = Object.fromEntries(
    Object.entries(prediction.sections).map(([key, value]) => [key, value.length])
  );

  return {
    metadata: prediction.metadata,
    fullAnalysisLength: prediction.fullAnalysis?.length ?? 0,
    sectionKeys: Object.keys(prediction.sections ?? {}),
    sectionLengths,
  };
};

export default function BhriguPredictionView({
  category,
  title,
  description,
  icon,
  fetchPrediction,
  profile
}: BhriguPredictionViewProps) {
  const [prediction, setPrediction] = useState<NormalizedPrediction | null>(null);
  const [rawPrediction, setRawPrediction] = useState<DebugPredictionPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    code?: string;
    action: string;
    isNetwork: boolean;
    message: string;
  } | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [question, setQuestion] = useState('');
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [parsedFromFullAnalysis, setParsedFromFullAnalysis] = useState<Record<string, string>>({});
  const [isParsing, setIsParsing] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const workerRequestId = useRef(0);
  const listRef = useRef<VariableSizeList | null>(null);
  const itemSizeMap = useRef<Record<number, number>>({});

  const searchParams = useSearchParams();
  const language = getCurrentLanguage();
  const debugAllowed = searchParams?.get('debug') === 'true';
  const { expandedSections, setExpandedSection } = useSectionExpansionStore();

  useEffect(() => {
    if (profile) {
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
    }
  }, [profile]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return;
    }

    const worker = new Worker(new URL('../workers/fullAnalysisParserWorker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<AnalysisWorkerResponse>) => {
      if (!event.data || event.data.id !== workerRequestId.current) {
        return;
      }
      setParsedFromFullAnalysis(event.data.sections ?? {});
      setIsParsing(false);
    };

    worker.onerror = () => {
      setIsParsing(false);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const loadPrediction = async (forceRegenerate = false, profileHash?: string) => {
    if (!profile) return;

    if (!hasRequiredProfileFields(profile)) {
      setError('Please complete your birth details in your profile to generate predictions.');
      return;
    }

    setLoading(true);
    setError(null);
    setFromCache(false);

    try {
      const resolvedHash = profileHash ?? await getProfileHash(profile);
      const cacheKey = getPredictionCacheKey(profile, category, question);
      const cached = localStorage.getItem(cacheKey);

      if (!forceRegenerate && cached) {
        try {
          const parsed = JSON.parse(cached) as { profileHash: string; prediction: any };
          if (parsed.profileHash === resolvedHash) {
            const cachedPrediction = parsed.prediction;
            if (cachedPrediction?.sections && cachedPrediction?.fullAnalysis !== undefined) {
              setPrediction(cachedPrediction as NormalizedPrediction);
            } else if (cachedPrediction) {
              setPrediction(normalizePrediction(cachedPrediction, category));
            }
            setFromCache(true);
            setLoading(false);
            return;
          }
          localStorage.removeItem(cacheKey);
        } catch (parseError) {
          localStorage.removeItem(cacheKey);
        }
      }

      if (forceRegenerate) {
        localStorage.removeItem(cacheKey);
      }

      const profileData = {
        date_of_birth: profile.dateOfBirth,
        time_of_birth:  profile.timeOfBirth,
        place_of_birth:  profile.placeOfBirth,
        latitude: profile.latitude,
        longitude: profile.longitude,
        question: question || undefined,
        force_regenerate: forceRegenerate
      };

      const response = await fetchPrediction(profileData);
      const normalized = normalizePredictionResponse<BhriguPrediction>(response);

      if (normalized.status === 'success') {
        const compactPrediction = normalizePrediction(normalized.prediction, category);
        setPrediction(compactPrediction);
        setFromCache(Boolean(
          normalized.metadata?.from_cache ||
          normalized.metadata?.source === 'cache' ||
          normalized.message?.toLowerCase()?.includes('cache')
        ));
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            profileHash: resolvedHash,
            prediction: compactPrediction,
          })
        );
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
  }, [profile, category, question, fetchPrediction]);

  useEffect(() => {
    if (debugAllowed && debugMode && prediction) {
      setRawPrediction(buildDebugPayload(prediction));
    } else {
      setRawPrediction(null);
    }
  }, [debugAllowed, debugMode, prediction]);

  const formatCacheAge = (ageSeconds: number | null) => {
    if (ageSeconds === null) return 'Unknown';
    if (ageSeconds < 60) return `${ageSeconds}s`;
    const minutes = Math.floor(ageSeconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  const normalizedCategory = useMemo(() => {
    const categoryValue = prediction?.metadata?.category ?? prediction?.category ?? category;
    return normalizeCategoryKey(typeof categoryValue === 'string' ? categoryValue : category);
  }, [category, prediction?.category, prediction?.metadata?.category]);

  const sections = useMemo(
    () => CATEGORY_SECTIONS[normalizedCategory] || [],
    [normalizedCategory]
  );

  const directAvailableSections = useMemo(() => {
    if (!prediction) return [];
    return sections.filter(section => {
      const content = prediction[section.key];
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return false;
      }
      const trimmedContent = content.trim();
      const isRedirectOnly = (
        trimmedContent.length < 50 &&
        (trimmedContent.toLowerCase().includes('see full analysis') ||
         trimmedContent.toLowerCase().includes('see complete') ||
         trimmedContent.toLowerCase().includes('refer to'))
      );
      return !isRedirectOnly;
    });
  }, [prediction, sections]);

  const shouldParseFallback = Boolean(
    prediction?.full_analysis && sections.length > 0 && directAvailableSections.length === 0
  );

  // Client-side fallback to parse full_analysis into sections
  const parseFullAnalysisIntoSections = (fullAnalysis: string, cat: string): Record<string, string> => {
    const parsedSections: Record<string, string> = {};
    const categoryConfig = getEnglishSectionTitles(cat);

    if (!fullAnalysis) return parsedSections;
    
    for (const section of categoryConfig) {
      // Escape special regex characters in title
      const escapedTitle = section.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Try multiple patterns to find section content
      const patterns = [
        // ## Header format (most common)
        new RegExp(`##\\s*(?:\\d+\\.? \\s*)?${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n##|$)`, 'i'),
        // Numbered format (1.  Header)
        new RegExp(`\\n\\d+\\.\\s*${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n\\d+\\.|\\n##|$)`, 'i'),
        // Bold format (**Header**)
        new RegExp(`\\*\\*${escapedTitle}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*|\\n##|$)`, 'i'),
        // Plain header with colon
        new RegExp(`${escapedTitle}:\\s*([\\s\\S]*?)(?=\\n[A-Z][a-z]+:|\\n##|\\n\\d+\\.|$)`, 'i'),
      ];

      for (const pattern of patterns) {
        try {
          const match = fullAnalysis.match(pattern);
          if (match && match[1]?.trim().length > 50) {
            parsedSections[section.key] = match[1].trim();
            break;
          }
        } catch (e) {
          // Pattern failed, try next
          continue;
        }
      }
    }

    return parsedSections;
  };

  useEffect(() => {
    if (!prediction?.full_analysis) {
      setParsedFromFullAnalysis({});
      setIsParsing(false);
      return;
    }

    const categoryValue = prediction?.metadata?.category ?? prediction?.category ?? category;
    const normalizedCategory = normalizeCategoryKey(
      typeof categoryValue === 'string' ? categoryValue : category
    );
    const categoryConfig = getCategorySections(normalizedCategory);
    if (categoryConfig.length === 0) {
      setParsedFromFullAnalysis({});
      setIsParsing(false);
      return;
    }

    const worker = workerRef.current;
    if (!worker) {
      setParsedFromFullAnalysis(parseFullAnalysisIntoSections(prediction.full_analysis, normalizedCategory));
      setIsParsing(false);
      return;
    }

    setIsParsing(true);
    workerRequestId.current += 1;
    worker.postMessage({
      id: workerRequestId.current,
      fullAnalysis: prediction.full_analysis,
      category: normalizedCategory
    });
  }, [prediction?.full_analysis, category]);

  const renderSection = (
    sectionKey: string,
    sectionTitle: string,
    content: string,
    color: string,
    isOpen: boolean,
    onToggle: (next: boolean) => void
  ) => {
    // More lenient filtering - only exclude truly empty or placeholder content
    if (!content || content.trim() === '') {
      return null;
    }

    // Check if content is just a redirect to full analysis (but allow partial content)
    const trimmedContent = content.trim();
    const isRedirectOnly = (
      trimmedContent.length < 50 &&
      (trimmedContent.toLowerCase().includes('see full analysis') ||
       trimmedContent.toLowerCase().includes('see complete') ||
       trimmedContent.toLowerCase().includes('refer to'))
    );

    if (isRedirectOnly) {
      return null;
    }

    const colorClass = COLOR_CLASSES[color] || COLOR_CLASSES[DEFAULT_COLOR];

    return (
      <AccordionItem
        id={`section-${sectionKey}`}
        isOpen={isOpen}
        onToggle={onToggle}
        title={(
          <span className={`text-lg font-semibold ${colorClass.text} flex items-center gap-3`}>
            <span className={`w-1.5 h-6 bg-gradient-to-b ${colorClass.accent} rounded-full`} />
            {sectionTitle}
          </span>
        )}
        className={`bg-gradient-to-br from-gray-800/40 to-gray-900/40
                   border ${colorClass.border} ${colorClass.hover} rounded-xl transition-all p-6`}
        lazyRender
      >
        <div className="prose prose-invert prose-cyan max-w-none">
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </AccordionItem>
    );
  };

  const renderPredictionContent = () => {
    if (!prediction) return null;

    // Get the sections configuration for this category
    const categoryValue = prediction?.metadata?.category ?? prediction?.category ?? category;
    const normalizedCategory = normalizeCategoryKey(
      typeof categoryValue === 'string' ? categoryValue : category
    );
    const sections = getCategorySections(normalizedCategory);

    // First, try to get sections from the API response
    let availableSections = directAvailableSections;

    // FALLBACK: If no sections found but full_analysis exists, use regex results
    if (availableSections.length === 0 && prediction.full_analysis) {
      availableSections = sections.filter(section => {
        const content = parsedFromFullAnalysis[section.key];
        return content && content.trim().length > 50;
      });
    }
    const parsedFromFullAnalysisActive = Object.keys(parsedFromFullAnalysis).length > 0;

    // Helper function to get section content from either source
    const getSectionContent = (key: string): string => {
      return prediction.sections[key] || parsedFromFullAnalysis[key] || '';
    };

    const sectionListHeight = Math.min(
      availableSections.length * ESTIMATED_SECTION_HEIGHT,
      MAX_SECTION_LIST_HEIGHT
    );

    const getItemSize = (index: number) => itemSizeMap.current[index] ?? ESTIMATED_SECTION_HEIGHT;

    const setItemSize = (index: number, size: number) => {
      if (itemSizeMap.current[index] !== size) {
        itemSizeMap.current[index] = size;
        listRef.current?.resetAfterIndex(index);
      }
    };

    const SectionRow = ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const section = availableSections[index];
      const sectionId = `${normalizedCategory}:${section.key}`;
      const isOpen = Boolean(expandedSections[sectionId]);
      const content = getSectionContent(section.key);
      const rowRef = useRef<HTMLDivElement | null>(null);

      useLayoutEffect(() => {
        if (!rowRef.current) return;
        const height = rowRef.current.getBoundingClientRect().height;
        setItemSize(index, height + 16);
      }, [index, content, isOpen]);

      return (
        <div style={style}>
          <div ref={rowRef} className="pb-4">
            {renderSection(
              section.key,
              tLocale(section.titleKey, language),
              content,
              section.color,
              isOpen,
              (next) => setExpandedSection(sectionId, next)
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        {/* Banner for client-side parsed sections */}
        {parsedFromFullAnalysisActive && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
            <p className="text-cyan-300 text-sm font-semibold uppercase tracking-wide">
              Parsed from full analysis
            </p>
            <p className="text-gray-300 text-sm mt-1">
              These insights were extracted from the full reading for easier scanning.
            </p>
          </div>
        )}

        {/* Show message if no sections were extracted successfully */}
        {availableSections.length === 0 && prediction.fullAnalysis && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mb-6">
            <p className="text-amber-400 text-sm">
              Note: Individual sections could not be extracted from the analysis.
              The complete reading is shown below.
            </p>
          </div>
        )}

        {/* Category-Specific Sections - Display FIRST and prominently */}
        {availableSections.length > 0 && (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3 relative z-10">
                {icon}
                Detailed Insights
              </h2>
              <p className="text-gray-400 text-sm">
                Explore each aspect of your {title.toLowerCase()} in detail
              </p>
            </div>
            
            <Accordion className="grid grid-cols-1 gap-4">
              <VariableSizeList
                ref={listRef}
                height={sectionListHeight}
                itemCount={availableSections.length}
                itemSize={getItemSize}
                width="100%"
                overscanCount={2}
                className="pr-2"
              >
                {SectionRow}
              </VariableSizeList>
            </Accordion>
          </div>
        )}

        {/* Full Analysis - Collapsible at the bottom */}
        {prediction.full_analysis && (
          <FullAnalysisPanel fullAnalysis={prediction.full_analysis} />
        )}

        {/* Metadata */}
        {prediction.metadata && (
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              {prediction.metadata.zodiac_sign && (
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">Zodiac:</span>
                  <span>{prediction.metadata.zodiac_sign}</span>
                </div>
              )}
              {prediction.metadata.nakshatra && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">Nakshatra:</span>
                  <span>{prediction.metadata.nakshatra}</span>
                </div>
              )}
              {prediction.metadata.tradition && (
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">Tradition:</span>
                  <span>{prediction.metadata.tradition}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debug Mode - Raw API Response */}
        {debugAllowed && debugMode && (
          <DebugPanel
            prediction={prediction}
            parsedFromFullAnalysis={parsedFromFullAnalysis}
          />
        )}
      </div>
    );
  };

  if (! profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">Please create a profile to access predictions</p>
          <button
            onClick={handleGoToProfile}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500
                     text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600
                     transition-all"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-b border-cyan-500/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20
                          rounded-2xl flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
              <p className="text-gray-400">{description}</p>
            </div>
          </div>

          {/* Question Input */}
          <div className="mt-6 flex gap-3">
            <input
              type="text"
              placeholder="Ask a specific question (optional)..."
              value={question}
              onChange={handleQuestionChange}
              className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3
                       text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400
                       transition-colors"
            />
            <button
              onClick={handleLoadFromCache}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500
                       text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all
                       flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
          </div>

          {profileUpdated && (
            <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              Profile updated. Cached predictions cleared and a fresh reading is being generated.
            </div>
          )}

          {fromCache && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-cyan-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                <span>Loaded from Bhrigu wisdom cache</span>
              </div>
              <span className="text-xs text-gray-400">
                Loaded from cache
              </span>
              <button
                onClick={handleRegeneratePrediction}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 px-3 py-1 text-xs text-cyan-300
                         transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          )}

          <AnimatePresence>
            {errorDetails && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                  errorDetails.isNetwork
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                    : 'border-red-500/40 bg-red-500/10 text-red-200'
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">
                      {errorDetails.isNetwork ? 'Network issue detected' : 'API request failed'}
                    </p>
                    <p className="text-xs text-gray-200/80">
                      {errorDetails.message}
                      {errorDetails.code && (
                        <span className="ml-2 inline-flex items-center rounded-full border border-white/20 px-2 py-0.5 text-[10px] uppercase">
                          {errorDetails.code}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-200/80 mt-1">
                      Suggested action: {errorDetails.action}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleLoadFromCache}
                      className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white hover:border-white/40"
                    >
                      Retry with cached data
                    </button>
                    <button
                      onClick={handleRegeneratePrediction}
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                    >
                      Retry request
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && !prediction && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
            <p className="text-lg text-gray-400">
              Consulting ancient Bhrigu Samhita wisdom...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This may take a moment as we generate your personalized prediction
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="space-y-2">
              <p className="text-red-400">{error}</p>
              {errorDetails?.code && (
                <p className="text-xs text-red-200/80">Error code: {errorDetails.code}</p>
              )}
              {errorDetails?.action && (
                <p className="text-xs text-red-200/80">Suggested action: {errorDetails.action}</p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleRegeneratePrediction}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry request
              </button>
              <button
                onClick={handleLoadFromCache}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry with cached data
              </button>
            </div>
          </div>
        )}

        {prediction && !loading && renderPredictionContent()}

        {/* Actions */}
        {prediction && (
          <div className="mt-12 flex gap-4 justify-center flex-wrap">
            <button
              onClick={handleRegeneratePrediction}
              disabled={loading}
              className="px-6 py-3 bg-gray-700/50 border border-gray-600
                       text-white rounded-lg hover:bg-gray-700 transition-all
                       flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
              Regenerate
            </button>
            <button
              className="px-6 py-3 bg-gray-700/50 border border-gray-600
                       text-white rounded-lg hover:bg-gray-700 transition-all
                       flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              className="px-6 py-3 bg-gray-700/50 border border-gray-600
                       text-white rounded-lg hover:bg-gray-700 transition-all
                       flex items-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
            {debugAllowed && (
              <button
                onClick={handleToggleDebugMode}
                className={`px-6 py-3 border rounded-lg transition-all
                         flex items-center gap-2 ${
                           debugMode
                             ? 'bg-red-500/20 border-red-500 text-red-400'
                             : 'bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700'
                         }`}
              >
                <BookOpen className="w-5 h-5" />
                {debugMode ? 'Hide Debug' : 'Debug Mode'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
