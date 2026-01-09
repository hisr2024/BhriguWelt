'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, Download, Share2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { Profile, BirthDetails, PredictionResult, BhriguPrediction } from '@/lib/types';
import { getCurrentLanguage, type Language } from '@/lib/copy';
import { tLocale } from '@/lib/locales';
import { Accordion } from '@/app/components/ui/Accordion';
import { AccordionItem } from '@/app/components/ui/AccordionItem';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { deleteItem, getAllItems, getItem, setItem, STORES } from '@/lib/storage';

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

const getProfileHashKey = (profile: Profile) => `${PROFILE_HASH_PREFIX}${profile.id ?? 'current'}`;

const getPredictionCacheKey = (profile: Profile, category: string) => {
  return `${PREDICTION_CACHE_PREFIX}${profile.id ?? 'current'}_${category}`;
};

const clearCachedPredictions = async (profile: Profile, encryptionKey: CryptoKey) => {
  const prefix = `${PREDICTION_CACHE_PREFIX}${profile.id ?? 'current'}_`;
  const items = await getAllItems(STORES.SETTINGS, encryptionKey);
  await Promise.all(
    items
      .filter((item) => typeof item?.id === 'string' && item.id.startsWith(prefix))
      .map((item) => deleteItem(STORES.SETTINGS, item.id))
  );
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

export default function BhriguPredictionView({
  category,
  title,
  description,
  icon,
  fetchPrediction,
  profile
}: BhriguPredictionViewProps) {
  const [prediction, setPrediction] = useState<BhriguPrediction | null>(null);
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [debugMode, setDebugMode] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [parsedFromFullAnalysis, setParsedFromFullAnalysis] = useState<Record<string, string>>({});
  const [isParsing, setIsParsing] = useState(false);
  const [expandedOnce, setExpandedOnce] = useState<Record<string, boolean>>({});
  const [expandingSections, setExpandingSections] = useState<Record<string, boolean>>({});
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const { encryptionKey } = useEncryption();

  const workerRef = useRef<Worker | null>(null);
  const workerRequestId = useRef(0);
  const expandingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  const searchParams = useSearchParams();
  const language = getCurrentLanguage();
  const debugAllowed = searchParams?.get('debug') === 'true';

  useEffect(() => {
    if (profile && encryptionKey) {
      const checkProfile = async () => {
        const currentHash = await getProfileHash(profile);
        const hashKey = getProfileHashKey(profile);
        const storedHash = await getItem(STORES.SETTINGS, hashKey, encryptionKey);
        const hasChanged = Boolean(storedHash && storedHash !== currentHash);

        if (hasChanged) {
          await clearCachedPredictions(profile, encryptionKey);
        }

        await setItem(STORES.SETTINGS, hashKey, currentHash, encryptionKey);
        setProfileUpdated(hasChanged);
        await loadPrediction(hasChanged, currentHash);
      };
      checkProfile();
    }
  }, [profile, encryptionKey]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadPrediction = async (forceRegenerate = false, profileHash?: string) => {
    if (!profile) return;
    if (!encryptionKey) return;

    if (!hasRequiredProfileFields(profile)) {
      setError('Please complete your birth details in your profile to generate predictions.');
      return;
    }

    setLoading(true);
    setError(null);
    setFromCache(false);
    setCacheTimestamp(null);

    try {
      const resolvedHash = profileHash ?? await getProfileHash(profile);
      const normalizedCategory = normalizeCategoryKey(category);
      const cacheKey = getPredictionCacheKey(profile, normalizedCategory);
      const offlineMode = typeof navigator !== 'undefined' && !navigator.onLine;
      setIsOffline(offlineMode);

      const cached = await getItem(STORES.SETTINGS, cacheKey, encryptionKey);
      if (!forceRegenerate && cached?.prediction) {
        if (cached.profileHash === resolvedHash) {
          setPrediction(cached.prediction);
          setFromCache(true);
          setCacheTimestamp(cached.cachedAt ?? null);
          setLoading(false);
          return;
        }
        await deleteItem(STORES.SETTINGS, cacheKey);
      }

      if (offlineMode) {
        if (cached?.prediction) {
          setPrediction(cached.prediction);
          setFromCache(true);
          setCacheTimestamp(cached.cachedAt ?? null);
          setLoading(false);
          return;
        }
        setError('You are offline and no cached prediction is available.');
        setErrorDetails({
          code: 'OFFLINE',
          action: 'Reconnect to fetch a new prediction or try again later.',
          isNetwork: true,
          message: 'No cached prediction is available while offline.',
        });
        return;
      }

      if (forceRegenerate) {
        await deleteItem(STORES.SETTINGS, cacheKey);
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
        setPrediction(normalized.prediction);
        setFromCache(Boolean(
          normalized.metadata?.from_cache ||
          normalized.metadata?.source === 'cache' ||
          normalized.message?.toLowerCase()?.includes('cache')
        ));
        await setItem(
          STORES.SETTINGS,
          cacheKey,
          {
            profileHash: resolvedHash,
            prediction: normalized.prediction,
            cachedAt: new Date().toISOString(),
            question: question.trim() || null,
          },
          encryptionKey
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
      if (typeof navigator !== 'undefined') {
        setIsOffline(!navigator.onLine);
      }
    } finally {
      setLoading(false);
    }
  };

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

  // Client-side fallback to parse full_analysis into sections
  const parseFullAnalysisIntoSections = (fullAnalysis: string, cat: string): Record<string, string> => {
    const parsedSections: Record<string, string> = {};
    const categoryConfig = CATEGORY_SECTIONS[cat] || [];

    if (!fullAnalysis) return parsedSections;
    
    for (const section of categoryConfig) {
      const sectionTitle = tLocale(section.titleKey, 'en');
      // Escape special regex characters in title
      const escapedTitle = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
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
      return;
    }

    const categoryConfig = CATEGORY_SECTIONS[category] || [];
    if (categoryConfig.length === 0) {
      setParsedFromFullAnalysis({});
      return;
    }

    const worker = workerRef.current;
    if (!worker) {
      setParsedFromFullAnalysis(parseFullAnalysisIntoSections(prediction.full_analysis, category));
      return;
    }

    workerRequestId.current += 1;
    worker.postMessage({
      id: workerRequestId.current,
      markdown: prediction.full_analysis,
      sections: categoryConfig.map(section => ({ key: section.key, title: section.titleKey }))
    });
  }, [prediction?.full_analysis, category]);

  const renderSection = (sectionKey: string, sectionTitle: string, content: string, color: string) => {
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
        title={(
          <span className={`text-lg font-semibold ${colorClass.text} flex items-center gap-3`}>
            <span className={`w-1.5 h-6 bg-gradient-to-b ${colorClass.accent} rounded-full`} />
            {sectionTitle}
          </span>
        )}
        className={`bg-gradient-to-br from-gray-800/40 to-gray-900/40
                   border ${colorClass.border} ${colorClass.hover} rounded-xl transition-all p-6`}
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
    const sections = CATEGORY_SECTIONS[normalizedCategory] || [];

    // First, try to get sections from the API response
    let availableSections = sections.filter(section => {
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

    // FALLBACK: If no sections found but full_analysis exists, use worker/regex results
    if (availableSections.length === 0 && prediction.full_analysis) {
      availableSections = sections.filter(section => {
        const content = parsedFromFullAnalysis[section.key];
        return content && content.trim().length > 50;
      });
    }
    const parsedFromFullAnalysisActive = Object.keys(parsedFromFullAnalysis).length > 0;

    // Helper function to get section content from either source
    const getSectionContent = (key: string): string => {
      const directContent = prediction[key];
      if (typeof directContent === 'string') {
        return directContent;
      }
      return parsedFromFullAnalysis[key] || '';
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
        {availableSections.length === 0 && prediction.full_analysis && !isParsing && (
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
              {availableSections.map((section) => (
                <div key={section.key}>
                  {renderSection(
                    section.key,
                    tLocale(section.titleKey, language),
                    getSectionContent(section.key),
                    section.color
                  )}
                </div>
              ))}
            </Accordion>
          </div>
        )}

        {/* Full Analysis - Collapsible at the bottom */}
        {prediction.full_analysis && (
          <div className="mt-8 pt-8 border-t border-gray-700/50">
            <button
              onClick={() => setShowFullAnalysis(!showFullAnalysis)}
              aria-expanded={showFullAnalysis}
              aria-controls="full-analysis-content"
              className="w-full bg-gradient-to-br from-gray-800/50 to-gray-900/50
                       border border-gray-700/50 rounded-xl p-6
                       hover:border-cyan-500/30 transition-all
                       flex items-center justify-between group relative z-10"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-cyan-400" />
                <div className="text-left">
                  <h3 className="text-xl font-bold text-white relative z-10">
                    View Complete Reading
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {showFullAnalysis ? 'Hide' : 'Show'} the full unstructured analysis
                  </p>
                </div>
              </div>
              {showFullAnalysis ? (
                <ChevronUp className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              )}
              <span className="sr-only">
                {showFullAnalysis ? 'Hide full analysis' : 'Show full analysis'}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {showFullAnalysis && (
                <motion.div
                  key="full-analysis"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  id="full-analysis-content"
                  className="mt-4 bg-gradient-to-br from-gray-800/30 to-gray-900/30
                           border border-gray-700/50 rounded-xl p-6 overflow-visible"
                >
                  <div className="prose prose-invert prose-cyan max-w-none">
                    <div className="text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[70vh] overflow-auto pr-2">
                      {prediction.full_analysis}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
          <div className="mt-8 pt-6 border-t border-red-500/30">
            <div className="bg-gray-900/50 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold text-red-400 mb-4">🔧 Debug Mode - Raw API Response</h3>
              <div className="bg-black/50 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                  {JSON.stringify(prediction, null, 2)}
                </pre>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                <p className="mb-2">Section Keys Available:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(prediction).map(key => {
                    const value = prediction[key as keyof typeof prediction];
                    const isLongString = value && typeof value === 'string' && value.length > 100;
                    return (
                      <span
                        key={key}
                        className={`px-2 py-1 rounded ${
                          isLongString
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-700/50 text-gray-400'
                        }`}
                      >
                        {key} ({typeof value === 'string' ? value.length : 'N/A'} chars)
                      </span>
                    );
                  })}
                </div>
              </div>
              {/* Show parsed sections if fallback was used */}
              {Object.keys(parsedFromFullAnalysis).length > 0 && (
                <div className="mt-4 text-sm">
                  <p className="text-yellow-400 mb-2">Client-side Parsed Sections:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(parsedFromFullAnalysis).map(key => (
                      <span key={key} className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                        {key} ({parsedFromFullAnalysis[key]?.length || 0} chars)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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
            onClick={() => window.location.href = '/profile'}
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
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3
                       text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400
                       transition-colors"
            />
            <button
              onClick={() => loadPrediction(false)}
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

          {isOffline && (
            <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">Offline mode</p>
                  <p className="text-xs text-amber-100/80">
                    {cacheTimestamp
                      ? `Showing your last saved prediction from ${new Date(cacheTimestamp).toLocaleString()}.`
                      : 'No cached prediction available yet.'}
                  </p>
                </div>
                <button
                  onClick={() => loadPrediction(true)}
                  disabled={loading || isOffline}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-400/50 px-3 py-1 text-xs text-amber-100
                           transition hover:border-amber-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry when online
                </button>
              </div>
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
                onClick={() => loadPrediction(true)}
                disabled={loading || isOffline}
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
                      onClick={() => loadPrediction(false)}
                      className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white hover:border-white/40"
                    >
                      Retry with cached data
                    </button>
                    <button
                      onClick={() => loadPrediction(true)}
                      disabled={isOffline}
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                onClick={() => loadPrediction(true)}
                disabled={isOffline}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                Retry request
              </button>
              <button
                onClick={() => loadPrediction(false)}
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
              onClick={() => loadPrediction(true)}
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
                onClick={() => setDebugMode(!debugMode)}
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
