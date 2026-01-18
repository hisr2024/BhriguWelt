'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ArrowLeft,
  Moon,
  Sun,
  Zap,
  Loader2,
  Heart,
  Briefcase,
  Activity,
  TrendingUp,
  Clock,
  Compass,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { bhriguPredictionsAPI, BirthDetails } from '@/lib/api';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';

type TimeframeType = 'today' | 'week' | 'month' | 'year';

interface CategoryData {
  rating: number;
  message: string;
}

interface HoroscopeData {
  zodiacSign: string;
  timeframe: TimeframeType;
  overall: {
    energy: string;
    message: string;
    rating: number;
  };
  categories: {
    love: CategoryData;
    career: CategoryData;
    health: CategoryData;
    finance: CategoryData;
  };
  luckyElements: {
    number: number;
    color: string;
    time: string;
    direction: string;
  };
  mantra: string;
  guidance: string;
}

const TimeframeButton = ({
  active,
  onClick,
  icon,
  label,
  gradient
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  gradient: string;
}) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl font-medium transition-all border ${
      active
        ? `bg-gradient-to-br ${gradient} text-white border-white/20 shadow-lg`
        : 'bg-dark-card/50 text-white/70 hover:text-white border-white/5 hover:border-white/10'
    }`}
  >
    <motion.div
      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        active ? 'bg-white/20' : 'bg-white/5'
      }`}
    >
      {icon}
    </motion.div>
    <span className="text-sm">{label}</span>
    {active && (
      <motion.div
        layoutId="activeIndicator"
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
      />
    )}
  </motion.button>
);

const RatingStars = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) => {
  const starSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < rating
              ? 'fill-genz-cyber-yellow text-genz-cyber-yellow'
              : 'text-white/20'
          }`}
        />
      ))}
    </div>
  );
};

const CategoryCard = ({
  title,
  icon,
  rating,
  message,
  gradient,
  delay = 0
}: {
  title: string;
  icon: ReactNode;
  rating: number;
  message: string;
  gradient: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden rounded-2xl border border-white/10 bg-dark-card/80 backdrop-blur-sm"
  >
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            {icon}
          </div>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <RatingStars rating={rating} />
      </div>
      <p className="text-white/75 text-sm leading-relaxed line-clamp-3">{message}</p>
    </div>
  </motion.div>
);

export default function HoroscopePage() {
  const [timeframe, setTimeframe] = useState<TimeframeType>('today');
  const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const router = useRouter();

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

  useEffect(() => {
    if (encryptionKey) {
      loadHoroscope();
    }
  }, [encryptionKey, timeframe]);

  const loadHoroscope = async () => {
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

      const birthDetails: BirthDetails = {
        date_of_birth: profile.dateOfBirth,
        time_of_birth: profile.timeOfBirth,
        place_of_birth: profile.placeOfBirth,
        latitude: profile.latitude,
        longitude: profile.longitude,
      };

      try {
        const response = await bhriguPredictionsAPI.getPredictions(birthDetails);
        const prediction = normalizePredictionResponse<any>(response).prediction;
        setHoroscope(parseHoroscope(prediction, profile.zodiacSign || 'Aries'));
      } catch (apiError) {
        console.warn('API error, using offline fallback:', apiError);
        setHoroscope(getOfflineHoroscope(profile.zodiacSign || 'Aries'));
      }
    } catch (err) {
      console.error('Error loading horoscope:', err);
      setError('Failed to load horoscope');
    } finally {
      setLoading(false);
    }
  };

  const parseHoroscope = (prediction: any, zodiacSign: string): HoroscopeData => {
    const text = prediction?.[timeframe] || prediction?.daily || prediction?.prediction || '';

    return {
      zodiacSign,
      timeframe,
      overall: {
        energy: 'Positive',
        message: text || getDefaultMessage(timeframe, zodiacSign),
        rating: 4
      },
      categories: {
        love: { rating: 4, message: extractCategory(text, 'love') },
        career: { rating: 4, message: extractCategory(text, 'career') },
        health: { rating: 4, message: extractCategory(text, 'health') },
        finance: { rating: 4, message: extractCategory(text, 'finance') }
      },
      luckyElements: {
        number: (new Date().getDate() % 9) + 1,
        color: 'Electric Blue',
        time: '7:00 AM',
        direction: 'East'
      },
      mantra: 'Om Namah Shivaya',
      guidance: `Based on Bhrigu Samhita principles, ${zodiacSign} experiences cosmic alignment favoring growth and clarity.`
    };
  };

  const extractCategory = (text: string, category: string): string => {
    const defaults: Record<string, string> = {
      love: 'Romantic energies are favorable. Express your feelings with confidence.',
      career: 'Professional opportunities arise. Stay focused on your goals.',
      health: 'Physical vitality supports your activities. Maintain balance.',
      finance: 'Financial stability indicated. Plan wisely for growth.'
    };
    return defaults[category];
  };

  const getDefaultMessage = (tf: TimeframeType, sign: string): string => {
    const messages: Record<TimeframeType, string> = {
      today: `Today brings balanced cosmic energy for ${sign}. Focus on your core strengths and remain open to opportunities.`,
      week: `This week emphasizes growth and connection for ${sign}. Build on momentum early in the week.`,
      month: `This month offers expansion opportunities for ${sign}. Set clear intentions and follow through.`,
      year: `This year marks significant transformation for ${sign}. Embrace change with confidence.`
    };
    return messages[tf];
  };

  const getOfflineHoroscope = (zodiacSign: string): HoroscopeData => ({
    zodiacSign,
    timeframe,
    overall: {
      energy: 'Positive',
      message: getDefaultMessage(timeframe, zodiacSign),
      rating: 4
    },
    categories: {
      love: { rating: 4, message: 'Express your heart openly. Connections deepen through honest communication.' },
      career: { rating: 4, message: 'Professional momentum builds. Take initiative on key projects.' },
      health: { rating: 4, message: 'Vitality is good. Balance activity with adequate rest.' },
      finance: { rating: 4, message: 'Financial awareness guides wise decisions. Plan for stability.' }
    },
    luckyElements: {
      number: (new Date().getDate() % 9) + 1,
      color: 'Electric Blue',
      time: '7:00 AM',
      direction: 'East'
    },
    mantra: 'Om Namah Shivaya',
    guidance: `According to Bhrigu Samhita, ${zodiacSign} natives should honor cosmic energies through mindful action and regular meditation.`
  });

  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Loading your predictions...</div>
        </div>
      </div>
    );
  }

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

  const timeframes = [
    { id: 'today' as TimeframeType, icon: <Sun className="w-5 h-5" />, label: 'Today', gradient: 'from-genz-cyber-yellow to-genz-sunset-orange' },
    { id: 'week' as TimeframeType, icon: <Moon className="w-5 h-5" />, label: 'This Week', gradient: 'from-genz-purple-haze to-genz-lavender-dream' },
    { id: 'month' as TimeframeType, icon: <Star className="w-5 h-5" />, label: 'This Month', gradient: 'from-genz-electric-blue to-genz-mint-fresh' },
    { id: 'year' as TimeframeType, icon: <Zap className="w-5 h-5" />, label: 'This Year', gradient: 'from-genz-hot-pink to-genz-coral-pop' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="genz-container py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <GenZButton variant="ghost" size="sm">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
          </GenZButton>
          <GenZBadge variant="neon" size="sm" pulse>
            <Moon className="w-4 h-4 mr-1" />
            Horoscope
          </GenZBadge>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="genz-title mb-2">Your Predictions</h1>
          <p className="text-white/70">Cosmic guidance for your journey</p>
        </motion.div>

        {/* Timeframe Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-3 mb-8"
        >
          {timeframes.map((tf) => (
            <TimeframeButton
              key={tf.id}
              active={timeframe === tf.id}
              onClick={() => setTimeframe(tf.id)}
              icon={tf.icon}
              label={tf.label}
              gradient={tf.gradient}
            />
          ))}
        </motion.div>

        {horoscope && (
          <AnimatePresence mode="wait">
            <motion.div
              key={timeframe}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Overall Energy */}
              <GenZCard variant="gradient" className="mb-6 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-genz-cyber-yellow" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{horoscope.zodiacSign}</h2>
                      <p className="text-white/60 text-sm">Energy: {horoscope.overall.energy}</p>
                    </div>
                  </div>
                  <RatingStars rating={horoscope.overall.rating} size="lg" />
                </div>
                <p className="text-white/90 leading-relaxed">{horoscope.overall.message}</p>
              </GenZCard>

              {/* Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <CategoryCard
                  title="Love"
                  icon={<Heart className="w-5 h-5 text-white" />}
                  rating={horoscope.categories.love.rating}
                  message={horoscope.categories.love.message}
                  gradient="from-genz-hot-pink to-genz-coral-pop"
                  delay={0.1}
                />
                <CategoryCard
                  title="Career"
                  icon={<Briefcase className="w-5 h-5 text-white" />}
                  rating={horoscope.categories.career.rating}
                  message={horoscope.categories.career.message}
                  gradient="from-genz-electric-blue to-genz-mint-fresh"
                  delay={0.15}
                />
                <CategoryCard
                  title="Health"
                  icon={<Activity className="w-5 h-5 text-white" />}
                  rating={horoscope.categories.health.rating}
                  message={horoscope.categories.health.message}
                  gradient="from-genz-neon-green to-genz-lime-zest"
                  delay={0.2}
                />
                <CategoryCard
                  title="Finance"
                  icon={<TrendingUp className="w-5 h-5 text-white" />}
                  rating={horoscope.categories.finance.rating}
                  message={horoscope.categories.finance.message}
                  gradient="from-genz-cyber-yellow to-genz-sunset-orange"
                  delay={0.25}
                />
              </div>

              {/* Lucky Elements */}
              <GenZCard variant="neon" className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-genz-cyber-yellow" />
                  Lucky Elements
                </h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-genz-electric-blue mb-1">
                      {horoscope.luckyElements.number}
                    </div>
                    <p className="text-xs text-white/60">Lucky Number</p>
                  </div>
                  <div>
                    <div className="w-6 h-6 rounded-full bg-genz-electric-blue mx-auto mb-1 shadow-genz-glow" />
                    <p className="text-xs text-white/60">{horoscope.luckyElements.color}</p>
                  </div>
                  <div>
                    <Clock className="w-6 h-6 text-genz-purple-haze mx-auto mb-1" />
                    <p className="text-xs text-white/60">{horoscope.luckyElements.time}</p>
                  </div>
                  <div>
                    <Compass className="w-6 h-6 text-genz-mint-fresh mx-auto mb-1" />
                    <p className="text-xs text-white/60">{horoscope.luckyElements.direction}</p>
                  </div>
                </div>
              </GenZCard>

              {/* Bhrigu Guidance */}
              <GenZCard variant="glass" className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Moon className="w-5 h-5 text-genz-lavender-dream" />
                  Bhrigu Guidance
                </h3>
                <p className="text-white/80 leading-relaxed mb-4">{horoscope.guidance}</p>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Daily Mantra</p>
                  <p className="text-lg font-medium text-genz-electric-blue">{horoscope.mantra}</p>
                </div>
              </GenZCard>

              {/* Explore More */}
              <Link href="/bhrigu-predictions">
                <GenZCard variant="glass" className="group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-genz-electric-blue transition-colors">
                        Explore Deep Predictions
                      </h3>
                      <p className="text-sm text-white/60">
                        Karmic journey, past lives & more
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-genz-electric-blue group-hover:translate-x-1 transition-all" />
                  </div>
                </GenZCard>
              </Link>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
