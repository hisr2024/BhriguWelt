'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  Calendar,
  Star,
  Sparkles,
  ArrowLeft,
  Loader2,
  Heart,
  Briefcase,
  Activity,
  Wallet,
  RefreshCw,
  Clock,
  Compass,
  Zap,
} from 'lucide-react';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZButton from '../components/GenZButton';
import GenZBadge from '../components/GenZBadge';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { getItem, setItem, STORES } from '@/lib/storage';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { useOfflineWisdomCards } from '@/lib/wisdom';
import type { WisdomCard } from '@/lib/types';
import type { PredictionViewData, PredictionTimeframe, CategoryRating } from '@/lib/types/predictions';
import { parsePredictionToViewData } from '@/lib/utils/cleanPredictionContent';
import {
  getBhriguWisdom,
  getZodiacLuckyNumber,
  getZodiacLuckyColor,
  getZodiacDirection,
  getZodiacEmoji,
} from '@/lib/data/bhriguWisdom';
import Link from 'next/link';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// Star Rating Component
function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' };
  const maxStars = 5;

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star
          key={i}
          className={`${sizes[size]} ${
            i < rating
              ? 'text-genz-cyber-yellow fill-genz-cyber-yellow'
              : 'text-white/20'
          }`}
        />
      ))}
    </div>
  );
}

// Category Card Component
function CategoryCard({
  icon,
  title,
  rating,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  rating: CategoryRating;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <GenZCard variant="glass" className="h-full">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${color} flex items-center justify-center`}>
            {icon}
          </div>
          <StarRating rating={rating.rating} size="sm" />
        </div>
        <h4 className="text-lg font-display font-bold text-white mb-2">{title}</h4>
        <p className="text-white/70 text-sm leading-relaxed">{rating.message}</p>
        {rating.advice && (
          <p className="text-genz-electric-blue/80 text-xs mt-2 italic">{rating.advice}</p>
        )}
      </GenZCard>
    </motion.div>
  );
}

// Lucky Element Card
function LuckyElementCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="text-genz-electric-blue mb-1">{icon}</div>
      <span className="text-white font-bold text-lg">{value}</span>
      <span className="text-white/50 text-xs">{label}</span>
    </div>
  );
}

export default function PredictionsPage() {
  const [viewData, setViewData] = useState<PredictionViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PredictionTimeframe>('daily');
  const [refreshing, setRefreshing] = useState(false);
  const [syncWhenOnline, setSyncWhenOnline] = useState(true);
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null);
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const router = useRouter();
  const isOnline = useOnlineStatus();

  // Wisdom cards for offline mode
  const filterWisdomCards = useCallback(
    (card: WisdomCard) =>
      card.category === 'astrology' ||
      (card.tags ?? []).some((tag) =>
        ['sun', 'moon', 'mars', 'jupiter', 'venus', 'saturn', 'mercury'].includes(tag.toLowerCase())
      ),
    []
  );

  const { cards: wisdomCards, isLoading: wisdomLoading } = useOfflineWisdomCards({
    filter: filterWisdomCards,
  });

  // Auth redirects
  useEffect(() => {
    if (!encryptionLoading && !isSetup) {
      router.push('/setup-passcode');
    }
  }, [encryptionLoading, isSetup, router]);

  useEffect(() => {
    if (!encryptionLoading && isSetup && !isUnlocked) {
      router.push('/unlock');
    }
  }, [encryptionLoading, isSetup, isUnlocked, router]);

  // Load sync preference
  useEffect(() => {
    if (!encryptionKey) return;
    const loadSyncPreference = async () => {
      const savedPreference = await getItem(STORES.SETTINGS, 'predictions_sync_when_online', encryptionKey);
      if (typeof savedPreference === 'boolean') {
        setSyncWhenOnline(savedPreference);
      }
    };
    loadSyncPreference();
  }, [encryptionKey]);

  // Fetch predictions from the appropriate API endpoint
  const fetchPredictions = useCallback(async (forceRefresh = false) => {
    if (!encryptionKey) return;

    try {
      setLoading(true);
      setError(null);

      const profile = await loadCurrentProfile(encryptionKey);
      if (!profile) {
        setError('Please complete your profile first');
        setLoading(false);
        return;
      }

      const cacheKey = `predictions_cache_${activeTab}`;
      const isOffline = !isOnline;

      // Try to load from cache first if offline or not forcing refresh
      if (!forceRefresh) {
        const cached = await getItem(STORES.SETTINGS, cacheKey, encryptionKey);
        if (cached?.data) {
          const parsedData = parsePredictionToViewData(
            cached.data,
            activeTab,
            profile.zodiacSign || 'Aries'
          );
          setViewData({ ...parsedData, cached: true, cachedAt: cached.fetchedAt, offline: isOffline });
          setCacheTimestamp(cached.fetchedAt);

          // If online and we have cache, still try to refresh in background
          if (!isOffline) {
            setLoading(false);
            fetchFromAPI(profile, cacheKey, false);
            return;
          } else {
            setLoading(false);
            return;
          }
        }
      }

      // If offline and no cache, use offline fallback
      if (isOffline) {
        const offlineData = generateOfflinePrediction(activeTab, profile.zodiacSign || 'Aries');
        setViewData(offlineData);
        setCacheTimestamp(null);
        setLoading(false);
        return;
      }

      // Fetch from API
      await fetchFromAPI(profile, cacheKey, true);
    } catch (err) {
      console.error('Error loading predictions:', err);
      setError('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, [activeTab, encryptionKey, isOnline]);

  // API fetch helper
  const fetchFromAPI = async (
    profile: { dateOfBirth: string; timeOfBirth: string; placeOfBirth: string; latitude?: number; longitude?: number; zodiacSign?: string },
    cacheKey: string,
    showLoading: boolean
  ) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const endpoint = `${API_BASE}/api/insights/${activeTab}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Online': isOnline ? 'true' : 'false',
        },
        body: JSON.stringify({
          date_of_birth: profile.dateOfBirth,
          time_of_birth: profile.timeOfBirth,
          place_of_birth: profile.placeOfBirth,
          latitude: profile.latitude,
          longitude: profile.longitude,
          mode: 'online', // Use OpenAI when online
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Parse the response into view data
      const parsedData = parsePredictionToViewData(
        data.prediction || data.data || data,
        activeTab,
        profile.zodiacSign || 'Aries'
      );

      setViewData({ ...parsedData, offline: false, cached: false });
      setCacheTimestamp(null);

      // Cache the result
      if (encryptionKey) {
        await setItem(
          STORES.SETTINGS,
          cacheKey,
          { data: data.prediction || data.data || data, fetchedAt: new Date().toISOString() },
          encryptionKey
        );
      }
    } catch (err) {
      console.error('API fetch error:', err);

      // If API fails, try to use cached data or generate offline
      const cached = encryptionKey
        ? await getItem(STORES.SETTINGS, cacheKey, encryptionKey)
        : null;

      if (cached?.data) {
        const parsedData = parsePredictionToViewData(
          cached.data,
          activeTab,
          profile.zodiacSign || 'Aries'
        );
        setViewData({ ...parsedData, cached: true, cachedAt: cached.fetchedAt, offline: true });
        setCacheTimestamp(cached.fetchedAt);
      } else {
        const offlineData = generateOfflinePrediction(activeTab, profile.zodiacSign || 'Aries');
        setViewData(offlineData);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Generate offline prediction based on Bhrigu wisdom
  const generateOfflinePrediction = (
    timeframe: PredictionTimeframe,
    zodiacSign: string
  ): PredictionViewData => {
    const wisdom = getBhriguWisdom(zodiacSign, timeframe);

    return {
      timeframe,
      zodiacSign,
      energy: 'Positive',
      energyScore: 75,
      overall: wisdom.overall,
      categories: {
        love: { rating: 4, message: wisdom.love },
        career: { rating: 4, message: wisdom.career },
        health: { rating: 4, message: wisdom.health },
        finance: { rating: 4, message: wisdom.finance },
      },
      luckyElements: {
        number: getZodiacLuckyNumber(zodiacSign),
        color: getZodiacLuckyColor(zodiacSign),
        direction: getZodiacDirection(zodiacSign),
        time: '7:00 AM',
      },
      dos: wisdom.dos,
      donts: wisdom.donts,
      metadata: {
        tradition: 'Bhrigu Samhita & Nadi Jyotisha',
        generatedAt: new Date().toISOString(),
      },
      offline: true,
    };
  };

  // Load predictions when tab changes
  useEffect(() => {
    if (encryptionKey) {
      fetchPredictions();
    }
  }, [encryptionKey, activeTab, fetchPredictions]);

  // Sync when coming online
  useEffect(() => {
    if (isOnline && syncWhenOnline && encryptionKey && viewData?.offline) {
      fetchPredictions(true);
    }
  }, [isOnline, syncWhenOnline, encryptionKey, fetchPredictions, viewData?.offline]);

  // Loading state
  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Loading your {activeTab} predictions...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
        <AnimatedBackground />
        <FloatingElements />
        <div className="genz-container py-8 relative z-10">
          <GenZCard variant="glass" className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link href="/profile">
              <GenZButton variant="primary">Complete Profile</GenZButton>
            </Link>
          </GenZCard>
        </div>
        <BottomNav />
      </div>
    );
  }

  const tabs = [
    { id: 'daily' as const, label: 'Today', icon: <Sun className="w-4 h-4" /> },
    { id: 'weekly' as const, label: 'This Week', icon: <Moon className="w-4 h-4" /> },
    { id: 'monthly' as const, label: 'This Month', icon: <Calendar className="w-4 h-4" /> },
    { id: 'yearly' as const, label: 'This Year', icon: <Sparkles className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="genz-container py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link href="/dashboard">
            <GenZButton variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </GenZButton>
          </Link>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-display font-bold bg-gradient-to-r from-genz-hot-pink via-genz-electric-blue to-genz-cyber-yellow bg-clip-text text-transparent">
                Your Predictions
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <GenZBadge variant={viewData?.offline ? 'default' : 'neon'}>
                {viewData?.offline ? 'Offline' : 'Live'}
              </GenZBadge>
              {refreshing && (
                <RefreshCw className="w-4 h-4 text-genz-electric-blue animate-spin" />
              )}
            </div>
          </div>
          <p className="text-white/60">Cosmic guidance for your journey</p>
        </motion.div>

        {/* Cache indicator */}
        {viewData?.cached && cacheTimestamp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4"
          >
            <div className="bg-genz-electric-blue/10 border border-genz-electric-blue/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Clock className="w-4 h-4" />
                <span>Showing cached predictions from {new Date(cacheTimestamp).toLocaleString()}</span>
              </div>
              <GenZButton
                variant="ghost"
                size="sm"
                onClick={() => fetchPredictions(true)}
                disabled={!isOnline}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </GenZButton>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <GenZButton
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 whitespace-nowrap min-w-fit"
            >
              {tab.icon}
              {tab.label}
            </GenZButton>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {viewData && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Zodiac & Energy Header */}
              <GenZCard variant="gradient" className="mb-6 bg-gradient-to-br from-genz-purple-haze/30 to-genz-electric-blue/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-genz-hot-pink to-genz-cyber-yellow flex items-center justify-center">
                      <span className="text-2xl">{getZodiacEmoji(viewData.zodiacSign)}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-bold text-white">{viewData.zodiacSign}</h2>
                      <p className="text-white/60 text-sm">Energy: {viewData.energy}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StarRating rating={Math.round((viewData.energyScore || 75) / 20)} size="lg" />
                    <p className="text-white/50 text-xs mt-1">{viewData.energyScore || 75}% cosmic alignment</p>
                  </div>
                </div>

                {/* Overall Prediction */}
                <div className="bg-black/20 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-genz-cyber-yellow" />
                    {activeTab === 'daily' && 'Today\'s Cosmic Message'}
                    {activeTab === 'weekly' && 'This Week\'s Theme'}
                    {activeTab === 'monthly' && 'Monthly Overview'}
                    {activeTab === 'yearly' && 'Year Ahead'}
                  </h3>
                  <p className="text-white/80 leading-relaxed">{viewData.overall}</p>
                </div>
              </GenZCard>

              {/* Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <CategoryCard
                  icon={<Heart className="w-5 h-5 text-white" />}
                  title="Love"
                  rating={viewData.categories.love}
                  color="from-genz-hot-pink to-genz-coral-pop"
                />
                <CategoryCard
                  icon={<Briefcase className="w-5 h-5 text-white" />}
                  title="Career"
                  rating={viewData.categories.career}
                  color="from-genz-electric-blue to-genz-mint-fresh"
                />
                <CategoryCard
                  icon={<Activity className="w-5 h-5 text-white" />}
                  title="Health"
                  rating={viewData.categories.health}
                  color="from-genz-neon-green to-genz-lime-zest"
                />
                <CategoryCard
                  icon={<Wallet className="w-5 h-5 text-white" />}
                  title="Finance"
                  rating={viewData.categories.finance}
                  color="from-genz-cyber-yellow to-genz-sunset-orange"
                />
              </div>

              {/* Lucky Elements */}
              <GenZCard variant="neon" className="mb-6">
                <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-genz-cyber-yellow" />
                  Lucky Elements
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <LuckyElementCard
                    icon={<span className="text-lg font-bold">#</span>}
                    label="Lucky Number"
                    value={viewData.luckyElements.number}
                  />
                  <LuckyElementCard
                    icon={<div className="w-4 h-4 rounded-full" style={{ backgroundColor: getLuckyColorHex(viewData.luckyElements.color) }} />}
                    label={viewData.luckyElements.color}
                    value=""
                  />
                  <LuckyElementCard
                    icon={<Clock className="w-4 h-4" />}
                    label="Auspicious Time"
                    value={viewData.luckyElements.time || '7:00 AM'}
                  />
                  <LuckyElementCard
                    icon={<Compass className="w-4 h-4" />}
                    label="Direction"
                    value={viewData.luckyElements.direction || 'East'}
                  />
                </div>
              </GenZCard>

              {/* Do's and Don'ts */}
              {(viewData.dos?.length || viewData.donts?.length) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {viewData.dos && viewData.dos.length > 0 && (
                    <GenZCard variant="glass" className="border-l-4 border-genz-neon-green">
                      <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="text-genz-neon-green">✓</span> Do's
                      </h4>
                      <ul className="space-y-2">
                        {viewData.dos.map((item, i) => (
                          <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                            <span className="text-genz-neon-green mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </GenZCard>
                  )}
                  {viewData.donts && viewData.donts.length > 0 && (
                    <GenZCard variant="glass" className="border-l-4 border-genz-hot-pink">
                      <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="text-genz-hot-pink">✕</span> Don'ts
                      </h4>
                      <ul className="space-y-2">
                        {viewData.donts.map((item, i) => (
                          <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                            <span className="text-genz-hot-pink mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </GenZCard>
                  )}
                </div>
              )}

              {/* Weekly Details */}
              {activeTab === 'weekly' && viewData.weeklyDetails && (
                <GenZCard variant="glass" className="mb-6">
                  <h3 className="text-xl font-display font-bold text-white mb-4">Week at a Glance</h3>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {viewData.weeklyDetails.bestDays?.length > 0 && (
                      <GenZBadge variant="neon" size="sm">
                        Best Days: {viewData.weeklyDetails.bestDays.join(', ')}
                      </GenZBadge>
                    )}
                    {viewData.weeklyDetails.challengingDays?.length > 0 && (
                      <GenZBadge variant="default" size="sm">
                        Take Care: {viewData.weeklyDetails.challengingDays.join(', ')}
                      </GenZBadge>
                    )}
                  </div>
                  {viewData.weeklyDetails.dailyForecasts?.length > 0 && (
                    <div className="space-y-2">
                      {viewData.weeklyDetails.dailyForecasts.slice(0, 7).map((day, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                          <span className="text-white font-medium">{day.dayName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white/60 text-sm truncate max-w-[150px]">{day.summary}</span>
                            <StarRating rating={Math.round(day.energyScore / 20)} size="sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </GenZCard>
              )}

              {/* Monthly Details */}
              {activeTab === 'monthly' && viewData.monthlyDetails && (
                <GenZCard variant="glass" className="mb-6">
                  <h3 className="text-xl font-display font-bold text-white mb-4">
                    {viewData.monthlyDetails.monthName} {viewData.monthlyDetails.year}
                  </h3>
                  {viewData.monthlyDetails.mantra && (
                    <div className="bg-genz-purple-haze/20 rounded-xl p-4 mb-4">
                      <p className="text-white/60 text-xs mb-1">Monthly Mantra</p>
                      <p className="text-white font-medium italic">{viewData.monthlyDetails.mantra}</p>
                    </div>
                  )}
                  {viewData.monthlyDetails.powerDays?.length > 0 && (
                    <div>
                      <p className="text-white/60 text-sm mb-2">Power Days</p>
                      <div className="flex gap-2 flex-wrap">
                        {viewData.monthlyDetails.powerDays.map((day, i) => (
                          <GenZBadge key={i} variant="neon" size="sm">
                            {new Date(day).getDate()}
                          </GenZBadge>
                        ))}
                      </div>
                    </div>
                  )}
                </GenZCard>
              )}

              {/* Yearly Details */}
              {activeTab === 'yearly' && viewData.yearlyDetails && (
                <GenZCard variant="glass" className="mb-6">
                  <h3 className="text-xl font-display font-bold text-white mb-4">
                    {viewData.yearlyDetails.year} - {viewData.yearlyDetails.themeTitle}
                  </h3>
                  {viewData.yearlyDetails.keywords?.length > 0 && (
                    <div className="flex gap-2 mb-4 flex-wrap">
                      {viewData.yearlyDetails.keywords.map((keyword, i) => (
                        <GenZBadge key={i} variant="default" size="sm">
                          {keyword}
                        </GenZBadge>
                      ))}
                    </div>
                  )}
                  {viewData.yearlyDetails.quarters?.length > 0 && (
                    <div className="space-y-3">
                      {viewData.yearlyDetails.quarters.map((quarter, i) => (
                        <div key={i} className="bg-white/5 rounded-xl p-3">
                          <h4 className="text-white font-semibold mb-1">{quarter.name}</h4>
                          <p className="text-white/60 text-sm">{quarter.theme}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {viewData.yearlyDetails.annualGuidance && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-genz-purple-haze/20 to-genz-electric-blue/20 rounded-xl">
                      <p className="text-white/80 italic">{viewData.yearlyDetails.annualGuidance}</p>
                    </div>
                  )}
                </GenZCard>
              )}

              {/* Sync Settings */}
              <GenZCard variant="glass" className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">Auto-sync when online</p>
                    <p className="text-white/50 text-sm">Refresh predictions when connectivity returns</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncWhenOnline}
                      onChange={async (e) => {
                        const newValue = e.target.checked;
                        setSyncWhenOnline(newValue);
                        if (encryptionKey) {
                          await setItem(STORES.SETTINGS, 'predictions_sync_when_online', newValue, encryptionKey);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-genz-electric-blue"></div>
                  </label>
                </div>
              </GenZCard>

              {/* Wisdom Cards (Offline Mode) */}
              {viewData.offline && !wisdomLoading && wisdomCards.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3 className="text-2xl font-display font-bold text-white mb-4">
                    Vedic Wisdom
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wisdomCards.slice(0, 4).map((card, index) => (
                      <GenZCard key={index} variant="glass">
                        <GenZBadge variant="default" size="sm" className="mb-2">
                          {card.tradition}
                        </GenZBadge>
                        <h4 className="text-lg font-bold text-white mb-2">{card.title}</h4>
                        <p className="text-white/70 text-sm">{card.content}</p>
                      </GenZCard>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Tradition Attribution */}
              <div className="text-center mt-8 text-white/40 text-sm">
                <p>Based on {viewData.metadata.tradition}</p>
                {viewData.metadata.generatedAt && (
                  <p className="text-xs mt-1">Generated: {new Date(viewData.metadata.generatedAt).toLocaleString()}</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}

// ============================================================================
// HELPER FUNCTION - Lucky Color Hex Mapping
// ============================================================================

function getLuckyColorHex(color: string): string {
  const colors: Record<string, string> = {
    'Electric Blue': '#00D4FF',
    'Golden Yellow': '#FFD700',
    'Royal Purple': '#7B68EE',
    'Emerald Green': '#50C878',
    'Ruby Red': '#E0115F',
    'Silver White': '#C0C0C0',
    'Deep Crimson': '#DC143C',
    'Royal Gold': '#FFD700',
    'Forest Green': '#228B22',
    'Rose Pink': '#FF69B4',
    'Midnight Blue': '#191970',
    'Sea Green': '#2E8B57',
    Orange: '#FF8C00',
    Gold: '#FFD700',
    Silver: '#C0C0C0',
    Red: '#FF0000',
    Green: '#00FF00',
    Yellow: '#FFFF00',
    Pink: '#FF69B4',
    Blue: '#0000FF',
    White: '#FFFFFF',
  };
  return colors[color] || '#FFFFFF';
}
