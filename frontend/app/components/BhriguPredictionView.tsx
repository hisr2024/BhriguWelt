'use client';

import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, Download, Share2, BookOpen, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { Profile, BirthDetails, PredictionResult, BhriguPrediction } from '@/lib/types';
import { getCurrentLanguage, setLanguage as setLanguagePreference, type Language } from '@/lib/copy';
import { tLocale } from '@/lib/locales';
import { Accordion } from '@/app/components/ui/Accordion';
import { AccordionItem } from '@/app/components/ui/AccordionItem';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { deleteItem, getAllItems, getItem, setItem, STORES } from '@/lib/storage';
import { useBhriguPrediction } from '@/lib/hooks/useBhriguPrediction';
import useFeatureFlags from '@/hooks/useFeatureFlags';

const SECTION_LANGUAGES: Language[] = ['en', 'hi'];

// Storage keys for profile hash and prediction cache
const PROFILE_HASH_PREFIX = 'profile_hash_';
const PREDICTION_CACHE_PREFIX = 'bhrigu_prediction_';

type CategorySectionConfig = {
  key: string;
  titleKey: string;
  titleVariants: string[];
  color: string;
};

const getSectionTitleVariants = (titleKey: string): string[] => {
  const titles = SECTION_LANGUAGES.map((lang) => tLocale(titleKey, lang));
  return Array.from(new Set(titles));
};

// Category-specific section configurations (moved outside component for performance)
const CATEGORY_SECTIONS: Record<string, CategorySectionConfig[]> = {
  'karmic-journey': [
    { key: 'soul_purpose', titleKey: "bhriguPrediction.sections.karmic-journey.soul_purpose", titleVariants: getSectionTitleVariants("bhriguPrediction.sections.karmic-journey.soul_purpose"), color: 'cyan' },
    { key: 'karmic_blueprint', titleKey: 'bhriguPrediction.sections.karmic-journey.karmic_blueprint', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-journey.karmic_blueprint'), color: 'purple' },
    { key: 'evolution_stage', titleKey: 'bhriguPrediction.sections.karmic-journey.evolution_stage', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-journey.evolution_stage'), color: 'blue' },
    { key: 'life_mission', titleKey: 'bhriguPrediction.sections.karmic-journey.life_mission', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-journey.life_mission'), color: 'indigo' },
    { key: 'karmic_lessons', titleKey: 'bhriguPrediction.sections.karmic-journey.karmic_lessons', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-journey.karmic_lessons'), color: 'violet' },
    { key: 'soul_connections', titleKey: 'bhriguPrediction.sections.karmic-journey.soul_connections', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-journey.soul_connections'), color: 'pink' },
    { key: 'timing', titleKey: 'bhriguPrediction.sections.karmic-journey.timing', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-journey.timing'), color: 'rose' },
    { key: 'spiritual_gifts', titleKey: 'bhriguPrediction.sections.karmic-journey.spiritual_gifts', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-journey.spiritual_gifts'), color: 'amber' }
  ],
  'past-lives': [
    { key: 'recent_life', titleKey: 'bhriguPrediction.sections.past-lives.recent_life', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.past-lives.recent_life'), color: 'cyan' },
    { key: 'significant_lives', titleKey: 'bhriguPrediction.sections.past-lives.significant_lives', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.past-lives.significant_lives'), color: 'purple' },
    { key: 'karmic_patterns', titleKey: 'bhriguPrediction.sections.past-lives.karmic_patterns', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.past-lives.karmic_patterns'), color: 'blue' },
    { key: 'past_skills', titleKey: 'bhriguPrediction.sections.past-lives.past_skills', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.past-lives.past_skills'), color: 'indigo' },
    { key: 'traumas_healing', titleKey: 'bhriguPrediction.sections.past-lives.traumas_healing', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.past-lives.traumas_healing'), color: 'violet' },
    { key: 'past_relationships', titleKey: 'bhriguPrediction.sections.past-lives.past_relationships', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.past-lives.past_relationships'), color: 'pink' },
    { key: 'karmic_debts', titleKey: 'bhriguPrediction.sections.past-lives.karmic_debts', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.past-lives.karmic_debts'), color: 'rose' },
    { key: 'spiritual_progress', titleKey: 'bhriguPrediction.sections.past-lives.spiritual_progress', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.past-lives.spiritual_progress'), color: 'amber' }
  ],
  'future-lives': [
    { key: 'next_incarnation', titleKey: 'bhriguPrediction.sections.future-lives.next_incarnation', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.future-lives.next_incarnation'), color: 'cyan' },
    { key: 'evolution_trajectory', titleKey: 'bhriguPrediction.sections.future-lives.evolution_trajectory', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.future-lives.evolution_trajectory'), color: 'purple' },
    { key: 'final_birth_conditions', titleKey: 'bhriguPrediction.sections.future-lives.final_birth_conditions', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.future-lives.final_birth_conditions'), color: 'blue' },
    { key: 'future_scenarios', titleKey: 'bhriguPrediction.sections.future-lives.future_scenarios', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.future-lives.future_scenarios'), color: 'indigo' },
    { key: 'moksha_timeline', titleKey: 'bhriguPrediction.sections.future-lives.moksha_timeline', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.future-lives.moksha_timeline'), color: 'violet' },
    { key: 'higher_realms', titleKey: 'bhriguPrediction.sections.future-lives.higher_realms', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.future-lives.higher_realms'), color: 'pink' },
    { key: 'bodhisattva_path', titleKey: 'bhriguPrediction.sections.future-lives.bodhisattva_path', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.future-lives.bodhisattva_path'), color: 'rose' },
    { key: 'ultimate_destiny', titleKey: 'bhriguPrediction.sections.future-lives.ultimate_destiny', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.future-lives.ultimate_destiny'), color: 'amber' }
  ],
  'present-life': [
    { key: 'current_phase', titleKey: 'bhriguPrediction.sections.present-life.current_phase', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.present-life.current_phase'), color: 'cyan' },
    { key: 'career', titleKey: 'bhriguPrediction.sections.present-life.career', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.present-life.career'), color: 'purple' },
    { key: 'relationships', titleKey: 'bhriguPrediction.sections.present-life.relationships', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.present-life.relationships'), color: 'blue' },
    { key: 'health', titleKey: 'bhriguPrediction.sections.present-life.health', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.present-life.health'), color: 'indigo' },
    { key: 'finances', titleKey: 'bhriguPrediction.sections.present-life.finances', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.present-life.finances'), color: 'violet' },
    { key: 'spiritual_growth', titleKey: 'bhriguPrediction.sections.present-life.spiritual_growth', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.present-life.spiritual_growth'), color: 'pink' },
    { key: 'education', titleKey: 'bhriguPrediction.sections.present-life.education', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.present-life.education'), color: 'rose' },
    { key: 'life_purpose', titleKey: 'bhriguPrediction.sections.present-life.life_purpose', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.present-life.life_purpose'), color: 'amber' },
    { key: 'challenges', titleKey: 'bhriguPrediction.sections.present-life.challenges', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.present-life.challenges'), color: 'orange' },
    { key: 'timing', titleKey: 'bhriguPrediction.sections.present-life.timing', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.present-life.timing'), color: 'teal' }
  ],
  'life-events': [
    { key: 'yearly_forecast', titleKey: 'bhriguPrediction.sections.life-events.yearly_forecast', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.yearly_forecast'), color: 'cyan' },
    { key: 'marriage_timing', titleKey: 'bhriguPrediction.sections.life-events.marriage_timing', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.marriage_timing'), color: 'purple' },
    { key: 'career_milestones', titleKey: 'bhriguPrediction.sections.life-events.career_milestones', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.career_milestones'), color: 'blue' },
    { key: 'children_family', titleKey: 'bhriguPrediction.sections.life-events.children_family', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.children_family'), color: 'indigo' },
    { key: 'financial_events', titleKey: 'bhriguPrediction.sections.life-events.financial_events', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.financial_events'), color: 'violet' },
    { key: 'health_alerts', titleKey: 'bhriguPrediction.sections.life-events.health_alerts', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.health_alerts'), color: 'pink' },
    { key: 'spiritual_milestones', titleKey: 'bhriguPrediction.sections.life-events.spiritual_milestones', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.spiritual_milestones'), color: 'rose' },
    { key: 'relocations', titleKey: 'bhriguPrediction.sections.life-events.relocations', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.relocations'), color: 'amber' },
    { key: 'education', titleKey: 'bhriguPrediction.sections.life-events.education', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.education'), color: 'orange' },
    { key: 'favorable_periods', titleKey: 'bhriguPrediction.sections.life-events.favorable_periods', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.favorable_periods'), color: 'teal' },
    { key: 'challenging_periods', titleKey: 'bhriguPrediction.sections.life-events.challenging_periods', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.challenging_periods'), color: 'red' },
    { key: 'transits', titleKey: 'bhriguPrediction.sections.life-events.transits', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.transits'), color: 'lime' },
    { key: 'age_milestones', titleKey: 'bhriguPrediction.sections.life-events.age_milestones', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.life-events.age_milestones'), color: 'emerald' }
  ],
  'karmic-remedies': [
    { key: 'mantras', titleKey: 'bhriguPrediction.sections.karmic-remedies.mantras', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.mantras'), color: 'cyan' },
    { key: 'gemstones', titleKey: 'bhriguPrediction.sections.karmic-remedies.gemstones', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.gemstones'), color: 'purple' },
    { key: 'yantras', titleKey: 'bhriguPrediction.sections.karmic-remedies.yantras', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.yantras'), color: 'blue' },
    { key: 'charitable_activities', titleKey: 'bhriguPrediction.sections.karmic-remedies.charitable_activities', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.charitable_activities'), color: 'indigo' },
    { key: 'fasting', titleKey: 'bhriguPrediction.sections.karmic-remedies.fasting', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.fasting'), color: 'violet' },
    { key: 'deity_worship', titleKey: 'bhriguPrediction.sections.karmic-remedies.deity_worship', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.deity_worship'), color: 'pink' },
    { key: 'pilgrimage', titleKey: 'bhriguPrediction.sections.karmic-remedies.pilgrimage', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.pilgrimage'), color: 'rose' },
    { key: 'lifestyle', titleKey: 'bhriguPrediction.sections.karmic-remedies.lifestyle', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.lifestyle'), color: 'amber' },
    { key: 'planetary_rituals', titleKey: 'bhriguPrediction.sections.karmic-remedies.planetary_rituals', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.planetary_rituals'), color: 'orange' },
    { key: 'karmic_cleansing', titleKey: 'bhriguPrediction.sections.karmic-remedies.karmic_cleansing', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.karmic_cleansing'), color: 'teal' },
    { key: 'service', titleKey: 'bhriguPrediction.sections.karmic-remedies.service', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.service'), color: 'lime' },
    { key: 'meditation', titleKey: 'bhriguPrediction.sections.karmic-remedies.meditation', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.karmic-remedies.meditation'), color: 'emerald' }
  ],
  'relationships': [
    { key: 'romantic_marriage', titleKey: 'bhriguPrediction.sections.relationships.romantic_marriage', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.relationships.romantic_marriage'), color: 'cyan' },
    { key: 'family', titleKey: 'bhriguPrediction.sections.relationships.family', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.relationships.family'), color: 'purple' },
    { key: 'soul_connections', titleKey: 'bhriguPrediction.sections.relationships.soul_connections', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.relationships.soul_connections'), color: 'blue' },
    { key: 'friendships', titleKey: 'bhriguPrediction.sections.relationships.friendships', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.relationships.friendships'), color: 'indigo' },
    { key: 'professional', titleKey: 'bhriguPrediction.sections.relationships.professional', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.relationships.professional'), color: 'violet' },
    { key: 'karmic_patterns', titleKey: 'bhriguPrediction.sections.relationships.karmic_patterns', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.relationships.karmic_patterns'), color: 'pink' },
    { key: 'communication', titleKey: 'bhriguPrediction.sections.relationships.communication', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.relationships.communication'), color: 'rose' },
    { key: 'timing', titleKey: 'bhriguPrediction.sections.relationships.timing', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.relationships.timing'), color: 'amber' },
    { key: 'healing', titleKey: 'bhriguPrediction.sections.relationships.healing', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.relationships.healing'), color: 'orange' },
    { key: 'healthy_practices', titleKey: 'bhriguPrediction.sections.relationships.healthy_practices', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.relationships.healthy_practices'), color: 'teal' }
  ],
  'predictions': [
    { key: 'daily', titleKey: 'bhriguPrediction.sections.predictions.daily', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.predictions.daily'), color: 'cyan' },
    { key: 'weekly', titleKey: 'bhriguPrediction.sections.predictions.weekly', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.predictions.weekly'), color: 'purple' },
    { key: 'monthly', titleKey: 'bhriguPrediction.sections.predictions.monthly', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.predictions.monthly'), color: 'blue' },
    { key: 'yearly', titleKey: 'bhriguPrediction.sections.predictions.yearly', titleVariants: getSectionTitleVariants('bhriguPrediction.sections.predictions.yearly'), color: 'indigo' }
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
const SKELETON_LINES = 5;
const STREAM_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
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

type PredictionRequestOptions = {
  forceRegenerate?: boolean;
  profileHash?: string;
  questionOverride?: string;
  skipQueue?: boolean;
};

type QueuedPredictionRequest = {
  id: number;
  question: string;
  forceRegenerate: boolean;
  enqueuedAt: number;
};

const getProfileHashKey = (profile: Profile) => `${PROFILE_HASH_PREFIX}${profile.id ?? 'current'}`;

const getPredictionCacheKey = (profile: Profile, category: string, question: string, language: Language) => {
  const questionKey = question.trim() === '' ? 'default' : encodeURIComponent(question.trim());
  return `${PREDICTION_CACHE_PREFIX}${profile.id ?? 'current'}_${category}_${language}_${questionKey}`;
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
  const {
    prediction,
    loading,
    error,
    errorDetails,
    fromCache,
    question,
    setQuestion,
    profileUpdated,
    loadPrediction,
  } = useBhriguPrediction({ category, fetchPrediction, profile });
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  // View mode state management
  const [viewMode, setViewMode] = useState<'layman' | 'astrologer'>('layman');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [parsedFromFullAnalysis, setParsedFromFullAnalysis] = useState<Record<string, string>>({});
  const [isParsing, setIsParsing] = useState(false);
  const [expandedOnce, setExpandedOnce] = useState<Record<string, boolean>>({});
  const [expandingSections, setExpandingSections] = useState<Record<string, boolean>>({});

  // ✨ QUANTUM FIX: Use Set<string> for O(1) lookups and immutable ref tracking
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const expandedRef = useRef<Set<string>>(new Set()); // Immutable tracking for performance

  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const { encryptionKey } = useEncryption();

  const queuedRequests: QueuedPredictionRequest[] = [];

  const workerRef = useRef<Worker | null>(null);
  const workerRequestId = useRef(0);
  const expandingTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
  const queuedRequestsRef = useRef<QueuedPredictionRequest[]>([]);
  const requestIdRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const touchStartTime = useRef<number>(0); // Track touch duration to distinguish tap from scroll

  const { debugUI } = useFeatureFlags();
  const searchParams = useSearchParams();
  const [language, setLanguage] = useState<Language>(getCurrentLanguage());
  const debugAllowed = searchParams?.get('debug') === 'true';
  const predictionMode = (process.env.NEXT_PUBLIC_PREDICTION_MODE || 'full').toLowerCase();
  const allowComplexParsing = predictionMode !== 'simple';
  const simplifiedRendering = isLowEndDevice || !allowComplexParsing;

  // ✨ QUANTUM FIX: Toggle section with full event handling, state sync, and performance optimization
  const toggleSection = useCallback((key: string, e: React.MouseEvent | React.KeyboardEvent | React.TouchEvent) => {
    // Prevent default behavior and stop propagation to avoid conflicts
    e.preventDefault();
    e.stopPropagation();

    // Console log for verification (as requested)
    console.log('Section toggled:', key, { expanded: !expandedRef.current.has(key) });

    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
        console.log('Section collapsed:', key);
      } else {
        newSet.add(key);
        console.log('Section expanded:', key);
      }
      // Sync ref for immutable tracking (prevents memory leaks and stale closures)
      expandedRef.current = newSet;
      return newSet;
    });
  }, []);

  // ✨ QUANTUM FIX: Keyboard handler with Enter/Space support (WCAG 2.1 compliance)
  const handleKeyDown = useCallback((key: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault(); // Prevent page scroll on Space
      toggleSection(key, e);
    }
    // ESC key to collapse (bonus accessibility feature)
    if (e.key === 'Escape' && expandedRef.current.has(key)) {
      toggleSection(key, e);
    }
  }, [toggleSection]);

  // ✨ QUANTUM FIX: Touch handlers for mobile (300ms delay fix + scroll detection)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback((key: string, e: React.TouchEvent) => {
    const touchDuration = Date.now() - touchStartTime.current;
    // Only trigger if it's a quick tap (not a scroll/long press)
    if (touchDuration < 300) {
      toggleSection(key, e);
    }
  }, [toggleSection]);

  // Translation wrapper using current language
  const t = useCallback((key: string, vars?: Record<string, any>) => {
    const translated = tLocale(key, language);
    if (!vars) return translated;
    return Object.entries(vars).reduce((str, [key, value]) =>
      str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)), translated);
  }, [language]);

  // Load view mode preference from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedViewMode = localStorage.getItem('predictionViewMode');
        if (savedViewMode === 'layman' || savedViewMode === 'astrologer') {
          setViewMode(savedViewMode);
          setShowTechnicalDetails(savedViewMode === 'astrologer');
          console.log('📖 Loaded view mode preference:', savedViewMode);
        }
      } catch (error) {
        console.warn('⚠️ Failed to load view mode preference:', error);
      }
    }
  }, []);

  // Save view mode preference to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('predictionViewMode', viewMode);
        console.log('💾 Saved view mode preference:', viewMode);
      } catch (error) {
        console.warn('⚠️ Failed to save view mode preference:', error);
      }
    }
  }, [viewMode]);

  // Handle view mode toggle
  const handleViewModeChange = useCallback((mode: 'layman' | 'astrologer') => {
    setViewMode(mode);
    setShowTechnicalDetails(mode === 'astrologer');
  }, []);

  const reportMetric = useCallback((name: string, durationMs: number, metadata?: Record<string, unknown>) => {
    if (typeof window === 'undefined') return;
    const payload = {
      name,
      durationMs: Math.round(durationMs),
      category,
      ...metadata,
    };
    window.dispatchEvent(new CustomEvent('prediction:metric', { detail: payload }));
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.info('[prediction-metric]', payload);
    }
  }, [category]);

  // ✨ QUANTUM FIX: Memory leak prevention - cleanup expanded sections on unmount
  useEffect(() => {
    return () => {
      expandedRef.current.clear();
      console.log('🧹 Cleaned up expanded sections ref on unmount');
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const navigatorAny = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { effectiveType?: string };
    };
    const deviceMemory = navigatorAny.deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const effectiveType = navigatorAny.connection?.effectiveType;
    const lowEnd =
      (deviceMemory !== undefined && deviceMemory <= 4) ||
      (cores !== undefined && cores <= 4) ||
      effectiveType === '2g' ||
      effectiveType === 'slow-2g';
    setIsLowEndDevice(lowEnd);
  }, []);

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
        await loadPrediction(hasChanged, currentHash);
      };

      void checkProfile();
    }
  }, [profile, encryptionKey]);

  // ✨ QUANTUM FIX: Enhanced offline detection with localStorage fallback
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      console.log('📡 Online: Connection restored');
    };
    const handleOffline = () => {
      setIsOffline(true);
      console.log('📡 Offline: Using cached predictions if available');
    };

    if (typeof window !== 'undefined') {
      // Check initial online status
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
    return undefined;
  }, []);

  // ✨ QUANTUM FIX: Save prediction to localStorage for offline fallback
  useEffect(() => {
    if (prediction && typeof window !== 'undefined') {
      try {
        const cacheKey = `offline_prediction_${category}_${profile?.id || 'current'}`;
        const cacheData = {
          prediction,
          timestamp: new Date().toISOString(),
          category,
          language
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        setCacheTimestamp(cacheData.timestamp);
        console.log('💾 Prediction cached for offline use:', cacheKey);
      } catch (error) {
        console.warn('⚠️ Failed to cache prediction to localStorage:', error);
      }
    }
  }, [prediction, category, profile?.id, language]);

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
    setLanguagePreference(value);
  };


  const formatQueuedQuestion = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'General request';
    if (trimmed.length > 80) return `Question: "${trimmed.slice(0, 80)}…"`;
    return `Question: "${trimmed}"`;
  };

  // Client-side fallback to parse full_analysis into sections
  const parseFullAnalysisIntoSections = (fullAnalysis: string, cat: string): Record<string, string> => {
    const parsedSections: Record<string, string> = {};
    const categoryConfig = CATEGORY_SECTIONS[cat] || [];

    if (!fullAnalysis) return parsedSections;
    
    for (const section of categoryConfig) {
      for (const title of section.titleVariants) {
        const escapedTitle = title.replace(/[.*+?^${}()|\\[\]]/g, '\\$&');
        
        const patterns = [
          new RegExp(`##\\s*(?:\\d+\\.? \\s*)?${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n##|$)`, 'i'),
          new RegExp(`\\n\\d+\\.\\s*${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n\\d+\\.|\\n##|$)`, 'i'),
          new RegExp(`\\*\\*${escapedTitle}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*|\\n##|$)`, 'i'),
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
            continue;
          }
        }

        if (parsedSections[section.key]) {
          break;
        }
      }
    }

    return parsedSections;
  };

  // ✨ QUANTUM FIX: Memoize category sections for performance
  const getCategorySections = useCallback((normalizedCategory: string): CategorySectionConfig[] => {
    return CATEGORY_SECTIONS[normalizedCategory] || [];
  }, []);

  useEffect(() => {
    const predictionData = prediction;
    if (!predictionData?.full_analysis) {
      setParsedFromFullAnalysis({});
      setIsParsing(false);
      return;
    }

    if (simplifiedRendering) {
      setParsedFromFullAnalysis({});
      setIsParsing(false);
      return;
    }

    const categoryValue = predictionData?.metadata?.category ?? predictionData?.category ?? category;
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
      const content = predictionData[section.key];
      return typeof content === 'string' && content.trim().length > 0;
    });

    if (hasStructuredSections) {
      setParsedFromFullAnalysis({});
      return;
    }

    const worker = workerRef.current;
    if (!worker) {
      setIsParsing(true);
      const parseStart = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const parsed = parseFullAnalysisIntoSections(predictionData.full_analysis, category);
      setParsedFromFullAnalysis(parsed);
      setIsParsing(false);
      reportMetric('prediction.parse', (typeof performance !== 'undefined' ? performance.now() : Date.now()) - parseStart, {
        mode: 'regex',
        sectionsExtracted: Object.keys(parsed).length,
      });
      return;
    }

    setIsParsing(true);
    workerRequestId.current += 1;
    worker.postMessage({
      id: workerRequestId.current,
      markdown: predictionData.full_analysis,
      sections: categoryConfig.map(section => ({ key: section.key, titles: section.titleVariants }))
    });
  }, [prediction?.full_analysis, category, simplifiedRendering, reportMetric]);

  // ✨ QUANTUM FIX: Fully interactive renderSection with direct event handling
  const renderSection = useCallback((
    sectionKey: string,
    sectionTitle: string,
    content: string,
    color: string,
    isOpen: boolean,
    onToggle?: (next: boolean) => void
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
    const headerId = `header-${sectionKey}`;
    const contentId = `content-${sectionKey}`;

    return (
      <motion.div
        key={sectionKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`bg-gradient-to-br from-gray-800/40 to-gray-900/40
                   border ${colorClass.border} ${colorClass.hover} rounded-xl transition-all
                   focus-within:ring-2 focus-within:ring-cyan-400/50 focus-within:ring-offset-2 focus-within:ring-offset-gray-900`}
      >
        {/* ✨ Interactive Header with ARIA and touch support */}
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isOpen}
          aria-controls={contentId}
          aria-labelledby={headerId}
          onClick={(e) => toggleSection(sectionKey, e)}
          onKeyDown={(e) => handleKeyDown(sectionKey, e)}
          onTouchStart={handleTouchStart}
          onTouchEnd={(e) => handleTouchEnd(sectionKey, e)}
          className={`w-full text-left flex items-center justify-between gap-4 p-6 cursor-pointer
                     min-h-[44px] select-none transition-all
                     hover:bg-white/5 active:bg-white/10
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70`}
          style={{
            cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
            touchAction: 'manipulation' // Prevents 300ms delay on mobile
          }}
        >
          <h3 id={headerId} className={`text-lg md:text-xl font-semibold ${colorClass.text} flex items-center gap-3 flex-1`}>
            <span className={`w-1.5 h-6 bg-gradient-to-b ${colorClass.accent} rounded-full`} aria-hidden="true" />
            {sectionTitle}
          </h3>
          {/* Chevron icon with animation */}
          {isOpen ? (
            <ChevronUp
              className="w-5 h-5 text-cyan-300 transition-transform duration-200"
              aria-hidden="true"
            />
          ) : (
            <ChevronDown
              className="w-5 h-5 text-gray-400 transition-transform duration-200"
              aria-hidden="true"
            />
          )}
        </div>

        {/* ✨ Animated content with smooth expand/collapse */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={contentId}
              role="region"
              aria-labelledby={headerId}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }} // Cubic bezier for smooth animation
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 pt-0">
                <div className="prose prose-invert prose-cyan max-w-none">
                  <div className="text-slate-100/90 text-base md:text-lg leading-7 md:leading-8 whitespace-pre-wrap">
                    {content}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }, [toggleSection, handleKeyDown, handleTouchStart, handleTouchEnd]);

  // ✨ QUANTUM FIX: Updated to work with Set<string> instead of Record
  const setExpandedSection = useCallback((sectionId: string, isOpen: boolean) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(sectionId);
      } else {
        newSet.delete(sectionId);
      }
      expandedRef.current = newSet; // Keep ref in sync
      return newSet;
    });
  }, []);

  const handleGoToProfile = () => {
    window.location.href = '/profile';
  };

  const handleDownload = () => {
    if (!prediction) return;
    const data = JSON.stringify(prediction, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhrigu-prediction-${category}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    if (navigator.share && prediction?.full_analysis) {
      await navigator.share({
        title: title,
        text: prediction.full_analysis.substring(0, 100) + '...',
      });
    }
  };

  const handleToggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(e.target.value);
  };

  // ✨ QUANTUM FIX: Optimized rendering function with performance checks
  const renderPredictionContent = useCallback(() => {
    if (!prediction) return null;
    const predictionData = prediction;

    // Get the sections configuration for this category
    const categoryValue = predictionData?.metadata?.category ?? predictionData?.category ?? category;
    const normalizedCategory = normalizeCategoryKey(
      typeof categoryValue === 'string' ? categoryValue : category
    );
     const sections = CATEGORY_SECTIONS[normalizedCategory] || [];
    const shouldShowPartialBanner = false;

    // First, try to get sections from the API response
    let availableSections = sections.filter(section => {
      const content = predictionData[section.key];
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
    if (!simplifiedRendering && availableSections.length === 0 && prediction.full_analysis) {
      availableSections = sections.filter(section => {
        const content = parsedFromFullAnalysis[section.key];
        return content && content.trim().length > 50;
      });
    }
    const parsedFromFullAnalysisActive = Object.keys(parsedFromFullAnalysis).length > 0;

    // Helper function to get section content from either source
    const getSectionContent = (key: string): string => {
      const directContent = predictionData[key];
      if (typeof directContent === 'string') {
        return directContent;
      }
      return parsedFromFullAnalysis[key] || '';
    };


    if (simplifiedRendering) {
      return (
        <div className="space-y-6">
          <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 text-sm text-slate-100/80">
            {allowComplexParsing
              ? 'Simplified view enabled for low-end devices.'
              : 'Simplified view enabled by configuration.'}
          </div>
          {availableSections.length > 0 && (
            <div className="space-y-4">
              {availableSections.map((section) => (
                <div key={section.key} className="rounded-xl border border-gray-700/50 bg-gray-900/40 p-5">
                  <h3 className="text-lg md:text-xl font-semibold text-cyan-300 mb-2">
                    {tLocale(section.titleKey, language)}
                  </h3>
                  <p className="text-slate-100/90 text-base md:text-lg leading-7 md:leading-8 whitespace-pre-wrap">
                    {getSectionContent(section.key)}
                  </p>
                </div>
              ))}
            </div>
          )}
          {availableSections.length === 0 && prediction.full_analysis && (
            <div className="rounded-xl border border-gray-700/50 bg-gray-900/40 p-5">
              <h3 className="text-lg md:text-xl font-semibold text-cyan-300 mb-2">Full Reading</h3>
              <p className="text-slate-100/90 text-base md:text-lg leading-7 md:leading-8 whitespace-pre-wrap">
                {prediction.full_analysis}
              </p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Banner for client-side parsed sections */}
        {parsedFromFullAnalysisActive && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
            <p className="text-cyan-300 text-sm font-semibold uppercase tracking-wide">
              {t('bhriguPredictionView.parsedFromFullAnalysis.title')}
            </p>
            <p className="text-slate-100/80 text-sm mt-1">
              {t('bhriguPredictionView.parsedFromFullAnalysis.description')}
            </p>
          </div>
        )}

        {/* Show message if no sections were extracted successfully */}
        {availableSections.length === 0 && predictionData.full_analysis && !isParsing && (
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
              <p className="text-slate-100/70 text-sm">
                {t('bhriguPredictionView.detailSubtitle', { title })}
              </p>
            </div>
            
            <Accordion className="grid grid-cols-1 gap-4">
              {availableSections.map((section) => {
                const sectionId = `${normalizedCategory}:${section.key}`;
                const isOpen = expandedSections.has(sectionId); // ✨ QUANTUM FIX: Use Set.has() instead of Record lookup
                const content = getSectionContent(section.key);
                return renderSection(
                  sectionId,
                  tLocale(section.titleKey, language),
                  content,
                  section.color,
                  isOpen,
                  (next) => setExpandedSection(sectionId, next)
                );
              })}
            </Accordion>
          </div>
        )}

        {/* Full Analysis - Collapsible at the bottom */}
        {predictionData.full_analysis && (
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
                  <p className="text-sm text-slate-100/70 mt-1">
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
                    <div className="text-slate-100/90 text-base md:text-lg leading-7 md:leading-8 whitespace-pre-wrap max-h-[70vh] overflow-auto pr-2">
                      {predictionData.full_analysis}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Metadata */}
        {predictionData.metadata && (
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              {predictionData.metadata.zodiac_sign && (
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">Zodiac:</span>
                  <span>{predictionData.metadata.zodiac_sign}</span>
                </div>
              )}
              {predictionData.metadata.nakshatra && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">Nakshatra:</span>
                  <span>{predictionData.metadata.nakshatra}</span>
                </div>
              )}
              {predictionData.metadata.tradition && (
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">Tradition:</span>
                  <span>{predictionData.metadata.tradition}</span>
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
                  {Object.keys(predictionData || {}).map(key => {
                    const value = predictionData?.[key as keyof typeof predictionData];
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
  }, [
    prediction,
    simplifiedRendering,
    parsedFromFullAnalysis,
    isParsing,
    category,
    language,
    showFullAnalysis,
    debugAllowed,
    debugMode,
    expandedSections,
    renderSection,
    setExpandedSection,
    t
  ]); // ✨ QUANTUM FIX: Dependencies for useCallback

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

          {/* View Mode Toggle */}
          <div className="mt-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {/* Simple View Button */}
              <button
                onClick={() => handleViewModeChange('layman')}
                aria-pressed={viewMode === 'layman'}
                aria-label="Switch to Simple View"
                className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-semibold
                           transition-all duration-300 flex items-center justify-center gap-2
                           min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                           ${
                             viewMode === 'layman'
                               ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-genz-glow focus:ring-cyan-400'
                               : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-gray-500'
                           }`}
              >
                <span className="text-xl" aria-hidden="true">👤</span>
                <span>Simple View</span>
              </button>

              {/* Astrologer View Button */}
              <button
                onClick={() => handleViewModeChange('astrologer')}
                aria-pressed={viewMode === 'astrologer'}
                aria-label="Switch to Astrologer View"
                className={`flex-1 sm:flex-initial px-6 py-3 rounded-xl font-semibold
                           transition-all duration-300 flex items-center justify-center gap-2
                           min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                           ${
                             viewMode === 'astrologer'
                               ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-genz-glow focus:ring-purple-400'
                               : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-gray-500'
                           }`}
              >
                <span className="text-xl" aria-hidden="true">🔮</span>
                <span>Astrologer View</span>
              </button>
            </div>

            {/* Explainer Text */}
            <div className="mt-3 text-center">
              <p className="text-sm text-slate-100/70">
                {viewMode === 'layman' ? (
                  <>
                    <span className="text-cyan-400" aria-hidden="true">✨</span>
                    {' '}Reading simplified for easy understanding
                  </>
                ) : (
                  <>
                    <span className="text-purple-400" aria-hidden="true">📊</span>
                    {' '}Technical analysis with astrological references
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Question Input */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            <input
              type="text"
              placeholder={t('bhriguPredictionView.question.placeholder')}
              value={question}
              onChange={handleQuestionChange}
              className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3
                       text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400
                       transition-colors"
            />
            <div className="flex items-center gap-2">
              <label htmlFor="prediction-language" className="text-sm text-gray-400">
                Language
              </label>
              <select
                id="prediction-language"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-3 text-white
                         focus:outline-none focus:border-cyan-400 transition-colors"
              >
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
              </select>
            </div>
            <button
              onClick={() => loadPrediction()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500
                       text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all
                       flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Queue Request
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
                <span>{t('bhriguPredictionView.cache.loadedFromWisdom')}</span>
              </div>
              <span className="text-xs text-gray-400">
                {t('bhriguPredictionView.cache.loadedFromCache')}
              </span>
              <button
                onClick={() => loadPrediction(true)}
                disabled={loading || isOffline}
                className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 px-3 py-1 text-xs text-cyan-300
                         transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                {t('bhriguPredictionView.cache.refresh')}
              </button>
            </div>
          )}

          {queuedRequests.length > 0 && (
            <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              <div className="flex items-center gap-2 text-cyan-200">
                <Clock className="h-4 w-4" />
                <span className="font-semibold">Queued requests ({queuedRequests.length})</span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-cyan-100">
                {queuedRequests.map((request) => (
                  <li key={request.id} className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-200">
                      {request.forceRegenerate ? 'Regenerate' : 'Generate'}
                    </span>
                    <span>{formatQueuedQuestion(request.question)}</span>
                  </li>
                ))}
              </ul>
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
                      onClick={() => loadPrediction()}
                      className="rounded-lg border border-white/20 px-3 py-1 text-xs text-white hover:border-white/40"
                    >
                      {t('bhriguPredictionView.actions.retryCached')}
                    </button>
                    <button
                      onClick={() => loadPrediction(true)}
                      disabled={isOffline}
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs text-white hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
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
                onClick={() => loadPrediction(true)}
                disabled={isOffline}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" />
                {t('bhriguPredictionView.actions.retryRequest')}
              </button>
              <button
                onClick={() => loadPrediction()}
                className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {t('bhriguPredictionView.actions.retryCached')}
              </button>
            </div>
          </div>
        )}

        {prediction && (!loading || streaming) && renderPredictionContent()}

        {/* Actions */}
        {prediction && (
          <div className="mt-12 flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => loadPrediction(true)}
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
