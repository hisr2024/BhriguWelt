'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  Heart,
  Briefcase,
  Zap,
  ArrowLeft,
  TrendingUp,
  Loader2,
  Sun,
  Clock,
  Compass,
  Sparkles,
  ChevronRight,
  CheckCircle,
  XCircle,
  Calendar
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

interface DailyInsight {
  overall: {
    energy: string;
    rating: number;
    message: string;
  };
  categories: {
    category: string;
    icon: React.ReactNode;
    color: string;
    rating: number;
    message: string;
  }[];
  luckyElements: {
    number: number;
    color: string;
    time: string;
    direction: string;
  };
  doList: string[];
  dontList: string[];
  mantra: string;
  offline?: boolean;
}

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
  category,
  icon,
  color,
  rating,
  message,
  delay = 0
}: {
  category: string;
  icon: React.ReactNode;
  color: string;
  rating: number;
  message: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden rounded-2xl border border-white/10 bg-dark-card/80 backdrop-blur-sm"
  >
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${color}`} />
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
            {icon}
          </div>
          <h3 className="font-semibold text-white">{category}</h3>
        </div>
        <RatingStars rating={rating} />
      </div>
      <p className="text-white/75 text-sm leading-relaxed">{message}</p>
    </div>
  </motion.div>
);

export default function DailyInsightsPage() {
  const [insights, setInsights] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zodiacSign, setZodiacSign] = useState<string>('');
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
      loadDailyInsights();
    }
  }, [encryptionKey]);

  const loadDailyInsights = async () => {
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

      setZodiacSign(profile.zodiacSign || 'Aries');

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
        setInsights(parseDailyPrediction(prediction, profile.zodiacSign || 'Aries'));
      } catch (apiError) {
        console.warn('API error, using offline mode:', apiError);
        setInsights(getOfflineDailyInsights(profile.zodiacSign || 'Aries'));
      }
    } catch (err) {
      console.error('Error loading daily insights:', err);
      setError('Failed to load daily insights');
    } finally {
      setLoading(false);
    }
  };

  const parseDailyPrediction = (prediction: any, sign: string): DailyInsight => {
    const text = prediction?.daily || prediction?.prediction || '';

    return {
      overall: {
        energy: 'Positive',
        rating: 4,
        message: text || `Today brings balanced cosmic energy for ${sign}. Focus on your strengths and stay open to opportunities.`
      },
      categories: [
        {
          category: 'Love',
          icon: <Heart className="w-5 h-5 text-white" />,
          color: 'from-genz-hot-pink to-genz-coral-pop',
          rating: 4,
          message: 'Express your feelings openly. Connections deepen through honest communication.'
        },
        {
          category: 'Career',
          icon: <Briefcase className="w-5 h-5 text-white" />,
          color: 'from-genz-electric-blue to-genz-mint-fresh',
          rating: 4,
          message: 'Professional momentum builds. Take initiative on key projects.'
        },
        {
          category: 'Health',
          icon: <Zap className="w-5 h-5 text-white" />,
          color: 'from-genz-neon-green to-genz-lime-zest',
          rating: 4,
          message: 'Physical vitality is good. Balance activity with adequate rest.'
        },
        {
          category: 'Finance',
          icon: <TrendingUp className="w-5 h-5 text-white" />,
          color: 'from-genz-cyber-yellow to-genz-sunset-orange',
          rating: 4,
          message: 'Financial awareness guides wise decisions. Plan for stability.'
        }
      ],
      luckyElements: {
        number: (new Date().getDate() % 9) + 1,
        color: 'Electric Blue',
        time: '7:00 AM',
        direction: 'East'
      },
      doList: [
        'Focus on priority tasks early',
        'Practice gratitude and mindfulness',
        'Connect with loved ones',
        'Trust your intuition'
      ],
      dontList: [
        'Avoid impulsive decisions',
        'Don\'t neglect self-care',
        'Avoid unnecessary conflicts'
      ],
      mantra: 'Om Namah Shivaya'
    };
  };

  const getOfflineDailyInsights = (sign: string): DailyInsight => ({
    offline: true,
    overall: {
      energy: 'High',
      rating: 4,
      message: `The cosmic energies today favor ${sign}. Ancient wisdom guides your path toward manifestation and growth.`
    },
    categories: [
      {
        category: 'Love',
        icon: <Heart className="w-5 h-5 text-white" />,
        color: 'from-genz-hot-pink to-genz-coral-pop',
        rating: 4,
        message: 'Venus brings harmony. Express your feelings with confidence.'
      },
      {
        category: 'Career',
        icon: <Briefcase className="w-5 h-5 text-white" />,
        color: 'from-genz-electric-blue to-genz-mint-fresh',
        rating: 4,
        message: 'Jupiter blesses your endeavors. Take bold steps forward.'
      },
      {
        category: 'Health',
        icon: <Zap className="w-5 h-5 text-white" />,
        color: 'from-genz-neon-green to-genz-lime-zest',
        rating: 4,
        message: 'Maintain balance. The Moon influences your energy levels.'
      },
      {
        category: 'Finance',
        icon: <TrendingUp className="w-5 h-5 text-white" />,
        color: 'from-genz-cyber-yellow to-genz-sunset-orange',
        rating: 4,
        message: 'Mercury favors commerce. Review investments wisely.'
      }
    ],
    luckyElements: {
      number: 7,
      color: 'Electric Blue',
      time: '7:00 AM',
      direction: 'East'
    },
    doList: [
      'Focus on your core strengths',
      'Practice morning meditation',
      'Connect with supportive people',
      'Honor your commitments'
    ],
    dontList: [
      'Avoid rushing decisions',
      'Don\'t ignore rest signals',
      'Avoid unnecessary conflicts'
    ],
    mantra: 'Om Suryaya Namaha'
  });

  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Loading today's insights...</div>
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

  if (!insights) return null;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

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
          <div className="flex items-center gap-2">
            {insights.offline && (
              <GenZBadge variant="default" size="sm">Offline</GenZBadge>
            )}
            <GenZBadge variant="neon" size="sm" pulse>
              <Sun className="w-4 h-4 mr-1" />
              Daily Insights
            </GenZBadge>
          </div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="genz-title mb-2">Today's Forecast</h1>
          <div className="flex items-center justify-center gap-2 text-white/70">
            <Calendar className="w-4 h-4" />
            {dateStr}
          </div>
        </motion.div>

        {/* Overall Energy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GenZCard variant="gradient" className="mb-6 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-genz-cyber-yellow" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{zodiacSign}</h2>
                  <p className="text-white/60 text-sm">Energy: {insights.overall.energy}</p>
                </div>
              </div>
              <RatingStars rating={insights.overall.rating} size="lg" />
            </div>
            <p className="text-white/90 leading-relaxed">{insights.overall.message}</p>
          </GenZCard>
        </motion.div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {insights.categories.map((cat, index) => (
            <CategoryCard
              key={cat.category}
              {...cat}
              delay={0.15 + index * 0.05}
            />
          ))}
        </div>

        {/* Do's and Don'ts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Do List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <GenZCard variant="glass" className="h-full">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-genz-neon-green" />
                Today's Focus
              </h3>
              <ul className="space-y-2">
                {insights.doList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-genz-neon-green mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </GenZCard>
          </motion.div>

          {/* Don't List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <GenZCard variant="glass" className="h-full">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-genz-hot-pink" />
                Avoid Today
              </h3>
              <ul className="space-y-2">
                {insights.dontList.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-genz-hot-pink mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </GenZCard>
          </motion.div>
        </div>

        {/* Lucky Elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <GenZCard variant="neon" className="mb-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-genz-cyber-yellow" />
              Lucky Elements
            </h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-genz-electric-blue mb-1">
                  {insights.luckyElements.number}
                </div>
                <p className="text-xs text-white/60">Lucky Number</p>
              </div>
              <div>
                <div className="w-6 h-6 rounded-full bg-genz-electric-blue mx-auto mb-1 shadow-genz-glow" />
                <p className="text-xs text-white/60">{insights.luckyElements.color}</p>
              </div>
              <div>
                <Clock className="w-6 h-6 text-genz-purple-haze mx-auto mb-1" />
                <p className="text-xs text-white/60">{insights.luckyElements.time}</p>
              </div>
              <div>
                <Compass className="w-6 h-6 text-genz-mint-fresh mx-auto mb-1" />
                <p className="text-xs text-white/60">{insights.luckyElements.direction}</p>
              </div>
            </div>
          </GenZCard>
        </motion.div>

        {/* Daily Mantra */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <GenZCard variant="glass" className="mb-6">
            <div className="text-center">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Today's Mantra</p>
              <p className="text-xl font-medium text-genz-electric-blue">{insights.mantra}</p>
            </div>
          </GenZCard>
        </motion.div>

        {/* Explore More */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <Link href="/horoscope">
            <GenZCard variant="glass" className="group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-genz-electric-blue transition-colors">
                    View Full Horoscope
                  </h3>
                  <p className="text-sm text-white/60">
                    Weekly, monthly & yearly predictions
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-genz-electric-blue group-hover:translate-x-1 transition-all" />
              </div>
            </GenZCard>
          </Link>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
