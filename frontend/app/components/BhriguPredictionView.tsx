'use client';

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, Download, Share2, BookOpen } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { VariableSizeList } from 'react-window';
import type { Profile, BirthDetails, PredictionResult, BhriguPrediction } from '@/lib/types';
import { tLocale } from '@/lib/locales';
import { Accordion } from '@/app/components/ui/Accordion';
import { AccordionItem } from '@/app/components/ui/AccordionItem';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';
import { useI18n } from '@/lib/context/I18nContext';

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
const SECTION_HEADERS = sectionHeaders as Record<string, string[]>;
const PROFILE_HASH_PREFIX = 'profile_hash_';
const PREDICTION_CACHE_PREFIX = 'bhrigu_prediction_';
const PARTIAL_PREDICTION_CACHE_PREFIX = 'bhrigu_prediction_partial_';
const SKELETON_LINES = 5;
const LEGACY_UA_TOKENS = ['MSIE', 'Trident/', 'Edge/'];

const isLegacyBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (!('Worker' in window)) return true;
  const ua = navigator.userAgent || '';
  return LEGACY_UA_TOKENS.some(token => ua.includes(token));
};

const isAlphaNumeric = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return (
    (code >= 48 && code <= 57) ||
    (code >= 97 && code <= 122) ||
    (code >= 65 && code <= 90)
  );
};

const normalizeHeading = (value: string): string => {
  let output = '';
  let lastWasSpace = false;

  for (const char of value) {
    if (isAlphaNumeric(char)) {
      output += char.toLowerCase();
      lastWasSpace = false;
    } else if (!lastWasSpace) {
      output += ' ';
      lastWasSpace = true;
    }
  }

  return output.trim();
};

const isNumberedHeader = (line: string): boolean => {
  let index = 0;
  while (index < line.length && line[index] >= '0' && line[index] <= '9') {
    index += 1;
  }
  if (index === 0) return false;
  const nextChar = line[index];
  return nextChar === '.' || nextChar === ')';
};

const stripHeaderMarkers = (line: string): string => {
  let cleaned = line.trim();

  while (cleaned.startsWith('#')) {
    cleaned = cleaned.slice(1).trim();
  }

  if (cleaned.startsWith('**') && cleaned.endsWith('**') && cleaned.length > 4) {
    cleaned = cleaned.slice(2, cleaned.length - 2).trim();
  }

  if (isNumberedHeader(cleaned)) {
    let index = 0;
    while (index < cleaned.length && cleaned[index] >= '0' && cleaned[index] <= '9') {
      index += 1;
    }
    if (cleaned[index] === '.' || cleaned[index] === ')') {
      cleaned = cleaned.slice(index + 1).trim();
    }
  }

  if (cleaned.endsWith(':')) {
    cleaned = cleaned.slice(0, -1).trim();
  }

  return cleaned;
};

const isHeaderLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('#')) return true;
  if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) return true;
  if (isNumberedHeader(trimmed)) return true;
  if (trimmed.endsWith(':')) {
    const words = trimmed.split(' ').filter(Boolean).length;
    return words <= 6;
  }
  return false;
};

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
    profileData: BirthDetails & { question?: string; force_regenerate?: boolean; language?: string }
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

const getPredictionCacheKey = (
  profile: Profile,
  category: string,
  question: string,
  language: string
) => {
  const questionKey = question.trim() === '' ? 'default' : encodeURIComponent(question.trim());
  return `${PREDICTION_CACHE_PREFIX}${profile.id ?? 'current'}_${category}_${questionKey}_${language}`;
};

const getPartialPredictionCacheKey = (profile: Profile, category: string, question: string) => {
  const questionKey = question.trim() === '' ? 'default' : encodeURIComponent(question.trim());
  return `${PARTIAL_PREDICTION_CACHE_PREFIX}${profile.id ?? 'current'}_${category}_${questionKey}`;
};

const clearCachedPredictions = (profile: Profile) => {
  if (typeof window === 'undefined') return;
  const prefix = `${PREDICTION_CACHE_PREFIX}${profile.id ?? 'current'}_`;
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (key && (key.startsWith(prefix) || key.startsWith(PARTIAL_PREDICTION_CACHE_PREFIX))) {
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

const isSectionContentAvailable = (content: unknown) => {
  if (typeof content !== 'string') return false;
  const trimmedContent = content.trim();
  if (!trimmedContent) return false;
  const isRedirectOnly = (
    trimmedContent.length < 50 &&
    (trimmedContent.toLowerCase().includes('see full analysis') ||
      trimmedContent.toLowerCase().includes('see complete') ||
      trimmedContent.toLowerCase().includes('refer to'))
  );
  return !isRedirectOnly;
};

const getSectionAvailability = (prediction: BhriguPrediction, normalizedCategory: string) => {
  const sections = CATEGORY_SECTIONS[normalizedCategory] || [];
  const availableKeys = sections
    .filter((section) => isSectionContentAvailable(prediction[section.key]))
    .map((section) => section.key);
  const missingKeys = sections
    .filter((section) => !availableKeys.includes(section.key))
    .map((section) => section.key);
  return {
    availableKeys,
    missingKeys,
    total: sections.length
  };
};

const mergePredictionWithPartial = (
  incoming: BhriguPrediction,
  cached: BhriguPrediction | null,
  normalizedCategory: string
) => {
  if (!cached) return incoming;
  const merged: BhriguPrediction = {
    ...cached,
    ...incoming,
    full_analysis: incoming.full_analysis || cached.full_analysis,
    complete_analysis: incoming.complete_analysis || cached.complete_analysis,
    metadata: incoming.metadata || cached.metadata,
    category: incoming.category || cached.category,
    title: incoming.title || cached.title,
  };

  const sections = CATEGORY_SECTIONS[normalizedCategory] || [];
  for (const section of sections) {
    const incomingContent = incoming[section.key];
    const cachedContent = cached[section.key];
    if (!isSectionContentAvailable(incomingContent) && isSectionContentAvailable(cachedContent)) {
      merged[section.key] = cachedContent;
    }
  }

  return merged;
};

type PartialPredictionCache = {
  profileHash: string;
  prediction: BhriguPrediction;
  missingSectionKeys: string[];
  updatedAt: string;
};

export default function BhriguPredictionView({
  category,
  title,
  description,
  icon,
  fetchPrediction,
  profile
}: BhriguPredictionViewProps) {
  const { t, language, aiLanguage } = useI18n();
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
  const [debugMode, setDebugMode] = useState(false);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [parsedFromFullAnalysis, setParsedFromFullAnalysis] = useState<Record<string, string>>({});
  const [isParsing, setIsParsing] = useState(false);
  const [expandedOnce, setExpandedOnce] = useState<Record<string, boolean>>({});
  const [expandingSections, setExpandingSections] = useState<Record<string, boolean>>({});
  const [partialCacheUsed, setPartialCacheUsed] = useState(false);

  const workerRef = useRef<Worker | null>(null);
  const workerRequestId = useRef(0);
  const listRef = useRef<VariableSizeList | null>(null);
  const itemSizeMap = useRef<Record<number, number>>({});

  const { debugUI } = useFeatureFlags();
  const searchParams = useSearchParams();
  const debugAllowed = searchParams?.get('debug') === 'true';

  const buildPredictionExport = (predictionData: BhriguPrediction) => {
    const sections = CATEGORY_SECTIONS[category] ?? [];
    const sectionBlocks = sections
      .map((section) => {
        const value = predictionData[section.key];
        if (typeof value === 'string' && value.trim().length > 0) {
          return `## ${tLocale(section.titleKey, language)}\n${value.trim()}`;
        }
        return null;
      })
      .filter((block): block is string => Boolean(block));

    const analysisBlock =
      typeof predictionData.full_analysis === 'string' && predictionData.full_analysis.trim().length > 0
        ? predictionData.full_analysis.trim()
        : typeof predictionData.complete_analysis === 'string'
          ? predictionData.complete_analysis?.trim()
          : '';

    const metadataEntries = predictionData.metadata
      ? Object.entries(predictionData.metadata)
          .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
          .map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`)
      : [];

    const headerLines = [
      'BhriguWelt Prediction',
      `Category: ${title}`,
      profile?.name ? `Profile: ${profile.name}` : null,
      question ? `Question: ${question}` : null,
      `Generated: ${predictionData.generated_at ?? new Date().toISOString()}`
    ].filter((line): line is string => Boolean(line));

    const bodyLines = [
      ...sectionBlocks,
      analysisBlock ? `## Complete Analysis\n${analysisBlock}` : null,
      metadataEntries.length > 0 ? `## Metadata\n${metadataEntries.join('\n')}` : null
    ].filter((block): block is string => Boolean(block));

    return `${headerLines.join('\n')}\n\n${bodyLines.join('\n\n')}`;
  };

  const handleDownload = () => {
    if (!prediction) return;

    const exportText = buildPredictionExport(prediction);
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `bhriguwelt-${category}-${dateStamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (!prediction) return;

    const shareText = buildPredictionExport(prediction);
    const shareTitle = `${title} Prediction`;

    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        return;
      }

      console.warn('Sharing is not supported in this browser.');
    } catch (error) {
      console.error('Failed to share prediction:', error);
    }
  };

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
    if (profile) {
      loadPrediction(false);
    }
  }, [aiLanguage]);

  const loadPrediction = async (forceRegenerate = false, profileHash?: string) => {
    if (!profile) return;

    if (!hasRequiredProfileFields(profile)) {
      setError(t('bhriguPredictionView.errors.missingBirthDetails'));
      return;
    }

    setLoading(true);
    setError(null);
    setFromCache(false);
    setPartialCacheUsed(false);

    try {
      const resolvedHash = profileHash ?? await getProfileHash(profile);
      const cacheKey = getPredictionCacheKey(profile, category, question, aiLanguage);
      const cached = localStorage.getItem(cacheKey);
      const cachedPartial = localStorage.getItem(partialCacheKey);

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
            setPartialCacheUsed(false);
            setLoading(false);
            return;
          }
          localStorage.removeItem(cacheKey);
        } catch (parseError) {
          localStorage.removeItem(cacheKey);
        }
      }

      if (cachedPartial) {
        try {
          const parsedPartial = JSON.parse(cachedPartial) as PartialPredictionCache;
          if (parsedPartial.profileHash === resolvedHash) {
            setPrediction(parsedPartial.prediction);
            setPartialCacheUsed(true);
          } else {
            localStorage.removeItem(partialCacheKey);
          }
        } catch (parseError) {
          localStorage.removeItem(partialCacheKey);
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
        force_regenerate: forceRegenerate,
        language: aiLanguage
      };

      const response = await fetchPrediction(profileData);
      const normalized = normalizePredictionResponse<BhriguPrediction>(response);

      if (normalized.status === 'success') {
        const incomingPrediction = normalized.prediction as BhriguPrediction;
        const categoryValue = incomingPrediction?.metadata?.category ?? incomingPrediction?.category ?? category;
        const normalizedCategory = normalizeCategoryKey(
          typeof categoryValue === 'string' ? categoryValue : category
        );
        const cachedPrediction = cachedPartial
          ? (JSON.parse(cachedPartial) as PartialPredictionCache).prediction
          : null;
        const mergedPrediction = mergePredictionWithPartial(
          incomingPrediction,
          cachedPrediction,
          normalizedCategory
        );
        setPrediction(mergedPrediction);
        setFromCache(Boolean(
          normalized.metadata?.from_cache ||
          normalized.metadata?.source === 'cache' ||
          normalized.message?.toLowerCase()?.includes('cache')
        ));
        const availability = getSectionAvailability(mergedPrediction, normalizedCategory);
        const isPartial = availability.availableKeys.length > 0 && availability.missingKeys.length > 0;
        if (isPartial) {
          const partialPayload: PartialPredictionCache = {
            profileHash: resolvedHash,
            prediction: mergedPrediction,
            missingSectionKeys: availability.missingKeys,
            updatedAt: new Date().toISOString()
          };
          localStorage.setItem(partialCacheKey, JSON.stringify(partialPayload));
          setPartialCacheUsed(true);
        } else {
          localStorage.removeItem(partialCacheKey);
          setPartialCacheUsed(false);
        }
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            profileHash: resolvedHash,
            prediction: mergedPrediction,
          })
        );
      } else {
        setError(normalized.message || t('bhriguPredictionView.errors.failedToGenerate'));
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
      const message = apiMessage || err?.message || t('bhriguPredictionView.errors.generic');
      const isNetwork = !err?.response;
      const code = status ? `HTTP ${status}` : err?.code || err?.name;
      const action = isNetwork
        ? t('bhriguPredictionView.errors.networkAction')
        : status && status >= 500
          ? t('bhriguPredictionView.errors.serverAction')
          : t('bhriguPredictionView.errors.clientAction');

      setError(message);
      setErrorDetails({
        code,
        action,
        isNetwork,
        message
      });

      if (!prediction && cachedPartial) {
        try {
          const parsedPartial = JSON.parse(cachedPartial) as PartialPredictionCache;
          if (parsedPartial.profileHash === resolvedHash) {
            setPrediction(parsedPartial.prediction);
            setPartialCacheUsed(true);
          }
        } catch (parseError) {
          localStorage.removeItem(partialCacheKey);
        }
      }
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

  // Client-side fallback to parse full_analysis into sections
  const parseFullAnalysisIntoSections = (fullAnalysis: string, cat: string): Record<string, string> => {
    const parsedSections: Record<string, string> = {};
    const categoryConfig = CATEGORY_SECTIONS[cat] || [];

    if (!fullAnalysis) return parsedSections;

    const normalizedTitles = new Map<string, string>();
    for (const section of categoryConfig) {
      const sectionTitle = tLocale(section.titleKey, 'en');
      normalizedTitles.set(normalizeHeading(sectionTitle), section.key);
    }

    const findMatchingKey = (headingText: string): string | undefined => {
      const normalizedHeading = normalizeHeading(headingText);
      if (normalizedTitles.has(normalizedHeading)) {
        return normalizedTitles.get(normalizedHeading);
      }

      for (const [normalizedTitle, key] of normalizedTitles.entries()) {
        if (normalizedHeading.includes(normalizedTitle) || normalizedTitle.includes(normalizedHeading)) {
          return key;
        }
      }

      return undefined;
    };

    const lines = fullAnalysis.split('\n');
    let currentKey: string | undefined;
    let currentLines: string[] = [];

    const flushSection = () => {
      if (!currentKey) {
        currentLines = [];
        return;
      }
      const content = currentLines.join('\n').trim();
      if (content.length > 50) {
        parsedSections[currentKey] = content;
      }
      currentLines = [];
    };

    for (const line of lines) {
      if (isHeaderLine(line)) {
        flushSection();
        const headerText = stripHeaderMarkers(line);
        currentKey = headerText ? findMatchingKey(headerText) : undefined;
        continue;
      }

      if (currentKey) {
        currentLines.push(line);
      }
    }

    flushSection();
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

    const hasStructuredSections = categoryConfig.some(section => {
      const content = prediction[section.key];
      return typeof content === 'string' && content.trim().length > 0;
    });

    if (hasStructuredSections) {
      setParsedFromFullAnalysis({});
      return;
    }

    const worker = workerRef.current;
    if (!worker || isLegacyBrowser()) {
      setParsedFromFullAnalysis(parseFullAnalysisIntoSections(prediction.full_analysis, category));
      return;
    }

    setIsParsing(true);
    workerRequestId.current += 1;
    worker.postMessage({
      id: workerRequestId.current,
      markdown: prediction.full_analysis,
      sections: categoryConfig.map(section => ({
        key: section.key,
        titles: SECTION_HEADERS[section.key] || []
      }))
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
     const sections = CATEGORY_SECTIONS[normalizedCategory] || [];
    const availability = getSectionAvailability(prediction, normalizedCategory);
    const shouldShowPartialBanner = availability.availableKeys.length > 0 && availability.missingKeys.length > 0;

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
        {shouldShowPartialBanner && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <p className="text-amber-300 text-sm font-semibold uppercase tracking-wide">
              Partial insights available
            </p>
            <p className="text-gray-300 text-sm mt-1">
              {partialCacheUsed
                ? 'Showing cached sections while we continue fetching the remaining insights.'
                : 'Some sections are still loading. Retry to complete the reading.'}
            </p>
            <p className="text-gray-400 text-xs mt-2">
              {availability.availableKeys.length} of {availability.total} sections ready.
            </p>
            <div className="mt-3">
              <button
                onClick={() => loadPrediction(true)}
                className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 px-3 py-1 text-xs text-amber-200 hover:border-amber-400 hover:text-amber-100"
              >
                <RefreshCw className="w-3 h-3" />
                Fetch remaining sections
              </button>
            </div>
          </div>
        )}
        {/* Banner for client-side parsed sections */}
        {parsedFromFullAnalysisActive && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
            <p className="text-cyan-300 text-sm font-semibold uppercase tracking-wide">
              {t('bhriguPredictionView.parsedFromFullAnalysis.title')}
            </p>
            <p className="text-gray-300 text-sm mt-1">
              {t('bhriguPredictionView.parsedFromFullAnalysis.description')}
            </p>
          </div>
        )}

        {/* Show message if no sections were extracted successfully */}
        {availableSections.length === 0 && prediction.fullAnalysis && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mb-6">
            <p className="text-amber-400 text-sm">
              {t('bhriguPredictionView.sectionFallbackNote')}
            </p>
          </div>
        )}

        {/* Category-Specific Sections - Display FIRST and prominently */}
        {availableSections.length > 0 && (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3 relative z-10">
                {icon}
                {t('bhriguPredictionView.detailedInsights')}
              </h2>
              <p className="text-gray-400 text-sm">
                {t('bhriguPredictionView.detailSubtitle', { title })}
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
                    {t('bhriguPredictionView.fullReading.title')}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {showFullAnalysis
                      ? t('bhriguPredictionView.fullReading.hideDescription')
                      : t('bhriguPredictionView.fullReading.showDescription')}
                  </p>
                </div>
              </div>
              {showFullAnalysis ? (
                <ChevronUp className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              )}
              <span className="sr-only">
                {showFullAnalysis
                  ? t('bhriguPredictionView.fullReading.hideAria')
                  : t('bhriguPredictionView.fullReading.showAria')}
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
                  <span className="text-cyan-400">{t('bhriguPredictionView.metadata.zodiac')}</span>
                  <span>{prediction.metadata.zodiac_sign}</span>
                </div>
              )}
              {prediction.metadata.nakshatra && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">{t('bhriguPredictionView.metadata.nakshatra')}</span>
                  <span>{prediction.metadata.nakshatra}</span>
                </div>
              )}
              {prediction.metadata.tradition && (
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">{t('bhriguPredictionView.metadata.tradition')}</span>
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
              <h3 className="text-xl font-bold text-red-400 mb-4">
                {t('bhriguPredictionView.debug.title')}
              </h3>
              <div className="bg-black/50 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                  {JSON.stringify(prediction, null, 2)}
                </pre>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                <p className="mb-2">{t('bhriguPredictionView.debug.sectionKeys')}</p>
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
                  <p className="text-yellow-400 mb-2">
                    {t('bhriguPredictionView.debug.parsedSections')}
                  </p>
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
          <p className="text-xl text-gray-400 mb-4">
            {t('bhriguPredictionView.profileMissing.title')}
          </p>
          <button
            onClick={handleGoToProfile}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500
                     text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600
                     transition-all"
          >
            {t('bhriguPredictionView.profileMissing.action')}
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
              placeholder={t('bhriguPredictionView.question.placeholder')}
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
                  {t('bhriguPredictionView.question.generating')}
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  {t('bhriguPredictionView.question.generate')}
                </>
              )}
            </button>
          </div>

          {profileUpdated && (
            <div className="mt-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
              {t('bhriguPredictionView.profileUpdated')}
            </div>
          )}

          {fromCache && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-cyan-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                <span>{t('bhriguPredictionView.cache.loadedFromWisdom')}</span>
              </div>
              <span className="text-xs text-gray-400">
                {t('bhriguPredictionView.cache.loadedFromCache')}
              </span>
              <button
                onClick={handleRegeneratePrediction}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 px-3 py-1 text-xs text-cyan-300
                         transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                {t('bhriguPredictionView.cache.refresh')}
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
                      {errorDetails.isNetwork
                        ? t('bhriguPredictionView.errors.networkIssue')
                        : t('bhriguPredictionView.errors.apiFailed')}
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
                      {t('bhriguPredictionView.errors.suggestedAction')}: {errorDetails.action}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleLoadFromCache}
                      className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white hover:border-white/40"
                    >
                      {t('bhriguPredictionView.actions.retryCached')}
                    </button>
                    <button
                      onClick={handleRegeneratePrediction}
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20"
                    >
                      {t('bhriguPredictionView.actions.retryRequest')}
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
              {t('bhriguPredictionView.loading.title')}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t('bhriguPredictionView.loading.subtitle')}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="space-y-2">
              <p className="text-red-400">{error}</p>
              {errorDetails?.code && (
                <p className="text-xs text-red-200/80">
                  {t('bhriguPredictionView.errors.errorCode')}: {errorDetails.code}
                </p>
              )}
              {errorDetails?.action && (
                <p className="text-xs text-red-200/80">
                  {t('bhriguPredictionView.errors.suggestedAction')}: {errorDetails.action}
                </p>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={handleRegeneratePrediction}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t('bhriguPredictionView.actions.retryRequest')}
              </button>
              <button
                onClick={handleLoadFromCache}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t('bhriguPredictionView.actions.retryCached')}
              </button>
            </div>
          </div>
        )}

        {prediction && renderPredictionContent()}

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
              {t('bhriguPredictionView.actions.regenerate')}
            </button>
            <button
              onClick={handleDownload}
              className="px-6 py-3 bg-gray-700/50 border border-gray-600
                       text-white rounded-lg hover:bg-gray-700 transition-all
                       flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              {t('bhriguPredictionView.actions.download')}
            </button>
            <button
              onClick={handleShare}
              className="px-6 py-3 bg-gray-700/50 border border-gray-600
                       text-white rounded-lg hover:bg-gray-700 transition-all
                       flex items-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              {t('bhriguPredictionView.actions.share')}
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
                {debugMode
                  ? t('bhriguPredictionView.debug.hide')
                  : t('bhriguPredictionView.debug.show')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
