'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Star, Heart, Briefcase, Zap, ArrowLeft, TrendingUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge, { StatusBadge } from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { getItem, STORES } from '@/lib/storage';
import { predictionsAPI, BirthDetails } from '@/lib/api';

export default function DailyInsightsPage() {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const router = useRouter();

  // Redirect to passcode setup if not configured
  useEffect(() => {
    if (!encryptionLoading && !isSetup) {
      router.push('/setup-passcode');
    }
  }, [encryptionLoading, isSetup, router]);

  // Redirect to unlock if not unlocked
  useEffect(() => {
    if (!encryptionLoading && isSetup && !isUnlocked) {
      router.push('/unlock');
    }
  }, [encryptionLoading, isSetup, isUnlocked, router]);

  // Load daily insights from API
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

      // Load user profile
      const profile = await getItem(STORES.PROFILES, 'current_profile', encryptionKey);
      if (!profile) {
        setError('Please complete your profile first');
        setLoading(false);
        return;
      }

      // Prepare birth details
      const birthDetails: BirthDetails = {
        date_of_birth: profile.dateOfBirth,
        time_of_birth: profile.timeOfBirth,
        place_of_birth: profile.placeOfBirth,
        latitude: profile.latitude,
        longitude: profile.longitude,
      };

      // Call API to get daily prediction
      try {
        const prediction = await predictionsAPI.getDaily(birthDetails);
        setInsights(parseDailyPrediction(prediction));
      } catch (apiError) {
        console.error('API error, using offline mode:', apiError);
        // Fallback to Bhrigu Core Wisdom
        setInsights(getOfflineDailyInsights());
      }
    } catch (error) {
      console.error('Error loading daily insights:', error);
      setError('Failed to load daily insights');
    } finally {
      setLoading(false);
    }
  };

  const parseDailyPrediction = (prediction: any) => {
    // Parse the prediction text into categories
    const text = prediction?.data?.prediction || prediction?.prediction || '';
    
    return {
      overall: {
        energy: 'High',
        rating: 5,
        message: 'Today brings powerful cosmic energy for manifestation and growth.'
      },
      categories: [
        {
          category: 'Love',
          icon: <Heart className="w-6 h-6" />,
          color: 'from-genz-hot-pink to-genz-coral-pop',
          rating: 4,
          message: extractSection(text, ['love', 'relationship']) || 'Great day for romantic connections!',
        },
        {
          category: 'Career',
          icon: <Briefcase className="w-6 h-6" />,
          color: 'from-genz-electric-blue to-genz-mint-fresh',
          rating: 5,
          message: extractSection(text, ['career', 'professional', 'work']) || 'Professional opportunities abound.',
        },
        {
          category: 'Health',
          icon: <Zap className="w-6 h-6" />,
          color: 'from-genz-neon-green to-genz-lime-zest',
          rating: 4,
          message: extractSection(text, ['health', 'wellness', 'energy']) || 'Maintain balance in your wellness.',
        },
        {
          category: 'Finance',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'from-genz-cyber-yellow to-genz-sunset-orange',
          rating: 4,
          message: extractSection(text, ['finance', 'money', 'financial']) || 'Good time for financial planning.',
        },
      ],
      luckyElements: prediction?.data?.lucky_elements || {
        number: 7,
        color: 'Electric Blue',
        gemstone: '💎',
        time: '11:11 AM'
      }
    };
  };

  const extractSection = (text: string, keywords: string[]): string | null => {
    const lines = text.split('\n');
    for (const keyword of keywords) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(keyword)) {
          // Return the line and maybe the next one
          const section = lines.slice(i, Math.min(i + 3, lines.length)).join(' ');
          if (section.length > 20) {
            return section.substring(0, 200);
          }
        }
      }
    }
    return null;
  };

  const getOfflineDailyInsights = () => {
    return {
      offline: true,
      overall: {
        energy: 'High',
        rating: 5,
        message: 'The cosmic energies today favor action and manifestation. Ancient wisdom guides your path.'
      },
      categories: [
        {
          category: 'Love',
          icon: <Heart className="w-6 h-6" />,
          color: 'from-genz-hot-pink to-genz-coral-pop',
          rating: 4,
          message: 'Venus brings harmony. Express your feelings with confidence.',
        },
        {
          category: 'Career',
          icon: <Briefcase className="w-6 h-6" />,
          color: 'from-genz-electric-blue to-genz-mint-fresh',
          rating: 5,
          message: 'Jupiter blesses your professional endeavors. Take bold steps.',
        },
        {
          category: 'Health',
          icon: <Zap className="w-6 h-6" />,
          color: 'from-genz-neon-green to-genz-lime-zest',
          rating: 4,
          message: 'Maintain balance. The Moon influences your energy levels.',
        },
        {
          category: 'Finance',
          icon: <TrendingUp className="w-6 h-6" />,
          color: 'from-genz-cyber-yellow to-genz-sunset-orange',
          rating: 4,
          message: 'Mercury favors commerce. Review your investments wisely.',
        },
      ],
      luckyElements: {
        number: 7,
        color: 'Electric Blue',
        gemstone: '💎',
        time: '11:11 AM'
      }
    };
  };

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

  if (!insights) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="genz-container py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <GenZButton variant="ghost" size="sm">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
          </GenZButton>
          {insights.offline && (
            <GenZBadge variant="default" size="sm">
              Offline Mode
            </GenZBadge>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <GenZBadge variant="neon" size="lg" className="mb-6" pulse>
            ☀️ Daily Insights
          </GenZBadge>
          <h1 className="genz-title mb-4">
            Today's Forecast
          </h1>
          <p className="text-xl text-white/80">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Overall Energy */}
        <GenZCard variant="gradient" className="mb-12 text-center p-8">
          <div className="text-7xl mb-4">⭐</div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">
            Overall Energy: {insights.overall.energy}
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            {insights.overall.message}
          </p>
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(insights.overall.rating)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-genz-cyber-yellow text-genz-cyber-yellow" />
            ))}
          </div>
        </GenZCard>

        {/* Category Insights */}
        <h2 className="genz-heading mb-8 text-center">
          Category Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.categories.map((insight: any, index: number) => (
            <GenZCard key={index} variant="glass" className="group">
              <div className="flex items-start gap-4 mb-4">
                <motion.div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${insight.color} flex items-center justify-center shadow-genz-glow flex-shrink-0`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  {insight.icon}
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-genz-electric-blue transition-colors">
                    {insight.category}
                  </h3>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < insight.rating
                            ? 'fill-genz-cyber-yellow text-genz-cyber-yellow'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-white/80 leading-relaxed">
                {insight.message}
              </p>
            </GenZCard>
          ))}
        </div>

        {/* Lucky Elements */}
        <GenZCard variant="neon" className="mt-12">
          <h3 className="text-2xl font-display font-bold text-white mb-6 text-center">
            Today's Lucky Elements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-4xl mb-2">{insights.luckyElements.number}</div>
              <p className="text-sm text-white/70">Lucky Number</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-genz-electric-blue mx-auto mb-2 shadow-genz-glow"></div>
              <p className="text-sm text-white/70">{insights.luckyElements.color}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">{insights.luckyElements.gemstone}</div>
              <p className="text-sm text-white/70">Gemstone</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🌅</div>
              <p className="text-sm text-white/70">{insights.luckyElements.time}</p>
            </div>
          </div>
        </GenZCard>
      </div>

      <BottomNav />
    </div>
  );
}
