'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCw, Download, Share2, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { Profile } from '@/lib/types';
import { Accordion } from '@/app/components/ui/Accordion';
import { AccordionItem } from '@/app/components/ui/AccordionItem';

// Category-specific section configurations (moved outside component for performance)
const CATEGORY_SECTIONS:  Record<string, Array<{ key: string; title:  string; color: string }>> = {
  'karmic-journey': [
    { key: 'soul_purpose', title: "Soul's Primary Purpose", color: 'cyan' },
    { key: 'karmic_blueprint', title: 'Karmic Blueprint', color: 'purple' },
    { key: 'evolution_stage', title: 'Soul Evolution Stage', color: 'blue' },
    { key: 'life_mission', title: 'Life Mission & Dharma', color: 'indigo' },
    { key: 'karmic_lessons', title: 'Karmic Lessons', color: 'violet' },
    { key: 'soul_connections', title: 'Soul Group Connections', color:  'pink' },
    { key: 'timing', title: 'Timing of Karmic Events', color: 'rose' },
    { key: 'spiritual_gifts', title: 'Spiritual Gifts & Abilities', color:  'amber' }
  ],
  'past-lives': [
    { key: 'recent_life', title:  'Most Recent Past Life', color: 'cyan' },
    { key: 'significant_lives', title: 'Significant Past Lives', color: 'purple' },
    { key: 'karmic_patterns', title: 'Recurring Karmic Patterns', color: 'blue' },
    { key: 'past_skills', title: 'Past Life Skills & Talents', color: 'indigo' },
    { key: 'traumas_healing', title: 'Past Life Traumas Needing Healing', color: 'violet' },
    { key: 'past_relationships', title:  'Past Life Relationships', color:  'pink' },
    { key:  'karmic_debts', title: 'Karmic Debts from Past Lives', color:  'rose' },
    { key: 'spiritual_progress', title: 'Past Life Spiritual Progress', color: 'amber' }
  ],
  'future-lives': [
    { key: 'next_incarnation', title: 'Next Incarnation', color: 'cyan' },
    { key: 'evolution_trajectory', title: 'Soul Evolution Trajectory', color: 'purple' },
    { key: 'final_birth_conditions', title: 'Final Birth Conditions', color: 'blue' },
    { key: 'future_scenarios', title: 'Future Life Scenarios', color: 'indigo' },
    { key: 'moksha_timeline', title: 'Moksha Timeline', color: 'violet' },
    { key: 'higher_realms', title: 'Higher Realms Access', color: 'pink' },
    { key: 'bodhisattva_path', title: 'Bodhisattva Path', color:  'rose' },
    { key:  'ultimate_destiny', title: 'Ultimate Destiny', color: 'amber' }
  ],
  'present-life': [
    { key: 'current_phase', title: 'Current Life Phase', color: 'cyan' },
    { key: 'career', title: 'Career & Professional Life', color: 'purple' },
    { key: 'relationships', title: 'Relationships & Love', color: 'blue' },
    { key: 'health', title: 'Health & Wellness', color: 'indigo' },
    { key: 'finances', title: 'Financial Prospects', color: 'violet' },
    { key: 'spiritual_growth', title: 'Spiritual Growth', color: 'pink' },
    { key: 'education', title: 'Education & Learning', color: 'rose' },
    { key: 'life_purpose', title:  'Life Purpose', color: 'amber' },
    { key:  'challenges', title: 'Current Challenges', color:  'orange' },
    { key:  'timing', title: 'Timing & Transitions', color: 'teal' }
  ],
  'life-events': [
    { key: 'yearly_forecast', title: 'Yearly Forecast', color: 'cyan' },
    { key: 'marriage_timing', title: 'Marriage Timing', color: 'purple' },
    { key: 'career_milestones', title:  'Career Milestones', color:  'blue' },
    { key:  'children_family', title: 'Children & Family', color: 'indigo' },
    { key: 'financial_events', title: 'Financial Events', color:  'violet' },
    { key:  'health_alerts', title: 'Health Alerts', color: 'pink' },
    { key: 'spiritual_milestones', title:  'Spiritual Milestones', color: 'rose' },
    { key: 'relocations', title: 'Relocations & Travel', color: 'amber' },
    { key: 'education', title: 'Educational Achievements', color: 'orange' },
    { key:  'favorable_periods', title: 'Favorable Periods', color: 'teal' },
    { key:  'challenging_periods', title: 'Challenging Periods', color: 'red' },
    { key:  'transits', title: 'Key Planetary Transits', color: 'lime' },
    { key:  'age_milestones', title:  'Age Milestones', color:  'emerald' }
  ],
  'karmic-remedies': [
    { key: 'mantras', title: 'Mantras & Chanting', color: 'cyan' },
    { key: 'gemstones', title:  'Gemstones & Crystals', color: 'purple' },
    { key: 'yantras', title:  'Yantras & Sacred Geometry', color:  'blue' },
    { key:  'charitable_activities', title: 'Charitable Activities', color: 'indigo' },
    { key: 'fasting', title: 'Fasting & Dietary Practices', color: 'violet' },
    { key: 'deity_worship', title:  'Deity Worship', color: 'pink' },
    { key: 'pilgrimage', title:  'Pilgrimage & Sacred Sites', color: 'rose' },
    { key: 'lifestyle', title: 'Lifestyle Modifications', color: 'amber' },
    { key: 'planetary_rituals', title: 'Planetary Rituals', color: 'orange' },
    { key: 'karmic_cleansing', title:  'Karmic Cleansing Practices', color: 'teal' },
    { key:  'service', title: 'Service & Seva', color: 'lime' },
    { key:  'meditation', title: 'Meditation & Yoga', color: 'emerald' }
  ],
  'relationships': [
    { key: 'romantic_marriage', title: 'Romantic & Marriage Prospects', color: 'cyan' },
    { key: 'family', title: 'Family Relationships', color: 'purple' },
    { key: 'soul_connections', title: 'Soul Connections & Soulmates', color:  'blue' },
    { key:  'friendships', title: 'Friendships & Social Circle', color: 'indigo' },
    { key: 'professional', title: 'Professional Relationships', color:  'violet' },
    { key:  'karmic_patterns', title: 'Karmic Relationship Patterns', color:  'pink' },
    { key: 'communication', title: 'Communication Dynamics', color: 'rose' },
    { key: 'timing', title: 'Relationship Timing', color:  'amber' },
    { key:  'healing', title: 'Relationship Healing', color:  'orange' },
    { key: 'healthy_practices', title: 'Healthy Relationship Practices', color:  'teal' }
  ],
  'predictions': [
    { key: 'daily', title: 'Daily Predictions', color:  'cyan' },
    { key:  'weekly', title: 'Weekly Forecast', color: 'purple' },
    { key: 'monthly', title: 'Monthly Outlook', color: 'blue' },
    { key: 'yearly', title: 'Yearly Overview', color: 'indigo' }
  ]
};

// Color classes configuration (moved outside component for performance)
const COLOR_CLASSES:  Record<string, { border: string; hover: string; accent: string; text: string }> = {
  cyan: { border: 'border-cyan-500/30', hover: 'hover:border-cyan-500/50', accent: 'from-cyan-400 to-cyan-600', text: 'text-cyan-400' },
  purple: { border: 'border-purple-500/30', hover: 'hover: border-purple-500/50', accent:  'from-purple-400 to-purple-600', text: 'text-purple-400' },
  blue: { border: 'border-blue-500/30', hover: 'hover:border-blue-500/50', accent: 'from-blue-400 to-blue-600', text: 'text-blue-400' },
  indigo: { border: 'border-indigo-500/30', hover: 'hover:border-indigo-500/50', accent: 'from-indigo-400 to-indigo-600', text: 'text-indigo-400' },
  violet: { border: 'border-violet-500/30', hover: 'hover: border-violet-500/50', accent:  'from-violet-400 to-violet-600', text: 'text-violet-400' },
  pink: { border: 'border-pink-500/30', hover: 'hover:border-pink-500/50', accent: 'from-pink-400 to-pink-600', text: 'text-pink-400' },
  rose: { border: 'border-rose-500/30', hover: 'hover: border-rose-500/50', accent:  'from-rose-400 to-rose-600', text: 'text-rose-400' },
  amber: { border: 'border-amber-500/30', hover: 'hover:border-amber-500/50', accent: 'from-amber-400 to-amber-600', text: 'text-amber-400' },
  orange: { border:  'border-orange-500/30', hover: 'hover:border-orange-500/50', accent: 'from-orange-400 to-orange-600', text: 'text-orange-400' },
  teal: { border: 'border-teal-500/30', hover: 'hover:border-teal-500/50', accent: 'from-teal-400 to-teal-600', text:  'text-teal-400' },
  red: { border: 'border-red-500/30', hover: 'hover: border-red-500/50', accent:  'from-red-400 to-red-600', text: 'text-red-400' },
  lime: { border: 'border-lime-500/30', hover: 'hover: border-lime-500/50', accent:  'from-lime-400 to-lime-600', text: 'text-lime-400' },
  emerald:  { border: 'border-emerald-500/30', hover: 'hover: border-emerald-500/50', accent: 'from-emerald-400 to-emerald-600', text: 'text-emerald-400' }
};

// Default color for sections without a specific color mapping
const DEFAULT_COLOR = 'cyan';
const ESCAPED_TITLE_PATTERN = /[.*+?^${}()|[\]\\]/g;
const SECTION_REGEX_CACHE = new Map<string, Map<string, RegExp[]>>();

const getSectionPatterns = (cat: string): Map<string, RegExp[]> => {
  const cached = SECTION_REGEX_CACHE.get(cat);
  if (cached) return cached;

  const patternMap = new Map<string, RegExp[]>();
  const categoryConfig = CATEGORY_SECTIONS[cat] || [];

  for (const section of categoryConfig) {
    const escapedTitle = section.title.replace(ESCAPED_TITLE_PATTERN, '\\$&');
    patternMap.set(section.key, [
      // ## Header format (most common)
      new RegExp(`##\\s*(?:\\d+\\.? \\s*)?${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n##|$)`, 'i'),
      // Numbered format (1.  Header)
      new RegExp(`\\n\\d+\\.\\s*${escapedTitle}[:\\s]*([\\s\\S]*?)(?=\\n\\d+\\.|\\n##|$)`, 'i'),
      // Bold format (**Header**)
      new RegExp(`\\*\\*${escapedTitle}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*|\\n##|$)`, 'i'),
      // Plain header with colon
      new RegExp(`${escapedTitle}:\\s*([\\s\\S]*?)(?=\\n[A-Z][a-z]+:|\\n##|\\n\\d+\\.|$)`, 'i'),
    ]);
  }

  SECTION_REGEX_CACHE.set(cat, patternMap);
  return patternMap;
};

const SectionCard = React.memo(function SectionCard({
  sectionTitle,
  content,
  colorClass
}: {
  sectionTitle: string;
  content: string;
  colorClass: { border: string; hover: string; accent: string; text: string };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-br from-gray-800/40 to-gray-900/40
                   border ${colorClass.border} ${colorClass.hover} rounded-xl p-6 transition-all`}
    >
      <h3 className={`text-xl font-bold ${colorClass.text} mb-4 flex items-center gap-3`}>
        <div className={`w-1. 5 h-6 bg-gradient-to-b ${colorClass.accent} rounded-full`} />
        {sectionTitle}
      </h3>
      <div className="prose prose-invert prose-cyan max-w-none">
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </motion.div>
  );
});

const FullAnalysisPanel = React.memo(function FullAnalysisPanel({
  showFullAnalysis,
  onToggle,
  fullAnalysis
}: {
  showFullAnalysis: boolean;
  onToggle: () => void;
  fullAnalysis: string;
}) {
  return (
    <div className="mt-8 pt-8 border-t border-gray-700/50">
      <button
        onClick={onToggle}
        className="w-full bg-gradient-to-br from-gray-800/50 to-gray-900/50
                       border border-gray-700/50 rounded-xl p-6
                       hover:border-cyan-500/30 transition-all
                       flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <div className="text-left">
            <h3 className="text-xl font-bold text-white">
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
      </button>

      <AnimatePresence>
        {showFullAnalysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration:  0.3 }}
            className="mt-4 bg-gradient-to-br from-gray-800/30 to-gray-900/30
                           border border-gray-700/50 rounded-xl p-6"
          >
            <div className="prose prose-invert prose-cyan max-w-none">
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {fullAnalysis}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

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
  const [fromCache, setFromCache] = useState(false);
  const [question, setQuestion] = useState('');
  const [showFullAnalysis, setShowFullAnalysis] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (profile) {
      setPrediction(null);
      setFromCache(false);
      setCacheAgeSeconds(null);
      setCacheKey(null);
      setError(null);
      loadPrediction();
    }

    loadPrediction();
  }, [profile]);

  useEffect(() => {
    if (! debugAllowed) {
      setDebugMode(false);
      return;
    }

    if (debugQueryEnabled) {
      setDebugMode(true);
    }
  }, [debugAllowed, debugQueryEnabled]);

  const loadPrediction = async (forceRegenerate = false) => {
    if (! profile) return;

    if (!hasRequiredProfileFields(profile)) {
      setError('Please complete your birth details in your profile to generate predictions.');
      return;
    }

    setLoading(true);
    setError(null);
    setCacheAgeSeconds(null);
    setCacheKey(null);

    try {
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
      const normalized = normalizePredictionResponse(response);

      if (response. status === 'success') {
        const predictionData = response.data?.prediction ?? response.data;
        const cacheAge = response.data?.cache_age ?? null;
        const cacheKeyValue = response.data?.cache_key ?? null;
        setPrediction(predictionData);
        setFromCache(
          Boolean(response.message?.toLowerCase().includes('cache')) ||
          cacheAge !== null
        );
        setCacheAgeSeconds(cacheAge);
        setCacheKey(cacheKeyValue);
      } else {
        setError(response.message || 'Failed to generate prediction');
      }
    } catch (err:  any) {
      setError(err. response?.data?.message || err.message || 'An error occurred');
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
    const cachedPatterns = getSectionPatterns(cat);
    
    if (! fullAnalysis) return parsedSections;
    
    for (const section of categoryConfig) {
      const patterns = cachedPatterns.get(section.key) ?? [];
      
      for (const pattern of patterns) {
        try {
          const match = fullAnalysis. match(pattern);
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

  const renderSection = (sectionKey: string, sectionTitle: string, content: string, color: string) => {
    // More lenient filtering - only exclude truly empty or placeholder content
    if (! content || content.trim() === '') {
      return null;
    }

    // Check if content is just a redirect to full analysis (but allow partial content)
    const trimmedContent = content. trim();
    const isRedirectOnly = (
      trimmedContent. length < 50 &&
      (trimmedContent.toLowerCase().includes('see full analysis') ||
       trimmedContent.toLowerCase().includes('see complete') ||
       trimmedContent.toLowerCase().includes('refer to'))
    );

    if (isRedirectOnly) {
      return null;
    }

    const colorClass = COLOR_CLASSES[color] || COLOR_CLASSES[DEFAULT_COLOR];
    const isExpanded = expandedSections[sectionKey] ?? false;
    const contentId = `prediction-section-${sectionKey}`;

    const isExpanded = expandedSections[sectionKey] ?? true;

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
                   border ${colorClass.border} ${colorClass.hover} rounded-xl transition-all`}
        triggerClassName="px-6 py-5"
        panelClassName="px-6 pb-6"
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
    if (! prediction) return null;

    // Get the sections configuration for this category
    const sections = CATEGORY_SECTIONS[category] || [];

    // First, try to get sections from the API response
    let availableSections = sections. filter(section => {
      const content = prediction[section.key];
      if (! content || typeof content !== 'string' || content.trim() === '') {
        return false;
      }
      const trimmedContent = content.trim();
      const isRedirectOnly = (
        trimmedContent.length < 50 &&
        (trimmedContent. toLowerCase().includes('see full analysis') ||
         trimmedContent. toLowerCase().includes('see complete') ||
         trimmedContent.toLowerCase().includes('refer to'))
      );
      return !isRedirectOnly;
    });

    // FALLBACK: If no sections found but full_analysis exists, parse it client-side
    if (availableSections.length === 0 && prediction.full_analysis) {
      // Update availableSections based on parsed content
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
        {availableSections. length === 0 && fullAnalysis && (
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
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                {icon}
                Detailed Insights
              </h2>
              <p className="text-gray-400 text-sm">
                Explore each aspect of your {title. toLowerCase()} in detail
              </p>
            </div>
            
            <Accordion className="grid grid-cols-1 gap-4">
              {availableSections.map((section) => (
                <div key={section.key}>
                  {renderSection(
                    section.key,
                    section.title,
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
          <FullAnalysisPanel
            showFullAnalysis={showFullAnalysis}
            onToggle={() => setShowFullAnalysis(!showFullAnalysis)}
            fullAnalysis={prediction.full_analysis}
          />
        )}

        {/* Default Full Analysis Panel (when no sections are available) */}
        {prediction.full_analysis && availableSections.length === 0 && (
          <div className="space-y-4">
            {renderSection(
              'full_analysis',
              'Full Analysis',
              prediction.full_analysis,
              DEFAULT_COLOR
            )}
          </div>
        )}

        {/* Metadata */}
        {metadata && (
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              {metadata.zodiac_sign && (
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">Zodiac:</span>
                  <span>{metadata.zodiac_sign}</span>
                </div>
              )}
              {metadata.nakshatra && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">Nakshatra:</span>
                  <span>{metadata.nakshatra}</span>
                </div>
              )}
              {metadata.tradition && (
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">Tradition:</span>
                  <span>{metadata.tradition}</span>
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
              {cacheKey && (
                <p className="mb-4 text-xs text-gray-400">
                  Cache key: <span className="text-gray-200">{cacheKey}</span>
                </p>
              )}
              <div className="bg-black/50 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                  {JSON.stringify(prediction, null, 2)}
                </pre>
              </div>
              <div className="mt-4 text-sm text-gray-400">
                <p className="mb-2">Section Keys Available:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(prediction).map(key => (
                    <span
                      key={key}
                      className={`px-2 py-1 rounded ${
                        prediction[key] && typeof prediction[key] === 'string' && prediction[key].length > 100
                          ? 'bg-green-500/20 text-green-400'
                          :  'bg-gray-700/50 text-gray-400'
                      }`}
                    >
                      {key} ({typeof prediction[key] === 'string' ?  prediction[key].length :  'N/A'} chars)
                    </span>
                  ))}
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
              onChange={(e) => setQuestion(e. target.value)}
              className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3
                       text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400
                       transition-colors"
            />
            <button
              onClick={() => loadPrediction(false)}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500
                       text-white rounded-lg font-semibold hover:from-cyan-600 hover: to-blue-600
                       disabled: opacity-50 disabled:cursor-not-allowed transition-all
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

          {fromCache && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-cyan-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full" />
                <span>Loaded from Bhrigu wisdom cache</span>
              </div>
              <span className="text-xs text-gray-400">
                Cache age: {formatCacheAge(cacheAgeSeconds)}
              </span>
              <button
                onClick={() => loadPrediction(true)}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 px-3 py-1 text-xs text-cyan-300
                         transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && ! prediction && (
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
            <p className="text-red-400">{error}</p>
            {profileValidation && !profileValidation.isValid ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-gray-300">
                  Update these details to continue:
                </p>
                <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
                  {profileValidation.missingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
                >
                  Complete Profile
                </button>
              </div>
            ) : (
              <button
                onClick={() => loadPrediction(false)}
                className="mt-4 text-sm text-cyan-400 hover: text-cyan-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
          </div>
        )}

        {prediction && ! loading && renderPredictionContent()}

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
                             :  'bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700'
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
