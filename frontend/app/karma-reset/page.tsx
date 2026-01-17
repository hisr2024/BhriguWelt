'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { RefreshCcw, Feather, BookOpen, Sparkles, Heart, ArrowLeft, Loader2 } from 'lucide-react';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import GenZCard from '../components/GenZCard';
import BottomNav from '../components/BottomNav';
import CardSkeleton from '../components/CardSkeleton';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { bhriguPredictionsAPI, BirthDetails } from '@/lib/api';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';
import Link from 'next/link';

export default function KarmaResetPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const router = useRouter();

  const buildFallbackReset = (reason: string) => ({
    offline: true,
    fallback_reason: reason,
    reset_overview:
      'This reset focuses on releasing repeating patterns and restoring inner clarity. Take gentle, consistent steps to realign with your values.',
    release_practices: [
      'Write and release one recurring worry each week.',
      'Practice forgiveness for yourself and others.',
      'Create space by clearing one physical area daily.'
    ],
    daily_reset:
      'Start with three calm breaths, set a clear intention, and close the day with gratitude journaling.',
    affirmations: [
      'I release what no longer serves my growth.',
      'I choose peace, clarity, and renewal.',
      'My karma aligns with compassionate action.'
    ],
    integration:
      'Sustain the reset through service, honesty, and mindful choices. Keep routines light but consistent.'
  });

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
      loadData();
    }
  }, [encryptionKey]);

  const loadData = async () => {
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
        const response = await bhriguPredictionsAPI.getKarmaReset(birthDetails);
        const normalized = normalizePredictionResponse<any>(response);
        if (normalized.status === 'error' || !normalized.prediction) {
          console.warn('Karma reset response invalid, using fallback:', normalized.message);
          setData(buildFallbackReset(normalized.message ?? 'Prediction unavailable'));
          return;
        }
        setData(normalized.prediction);
      } catch (apiError) {
        console.error('API error, using fallback reset:', apiError);
        setData(buildFallbackReset('API error'));
      }
    } catch (error) {
      console.error('Error loading karma reset:', error);
      setError('Failed to load karma reset guidance');
    } finally {
      setLoading(false);
    }
  };

  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Resetting your karma path...</div>
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

  const sections = [
    {
      title: 'Reset Overview',
      icon: <RefreshCcw className="w-6 h-6" />,
      content: data?.reset_overview,
      color: 'from-genz-electric-blue to-genz-mint-fresh',
    },
    {
      title: 'Release Practices',
      icon: <Feather className="w-6 h-6" />,
      content: data?.release_practices,
      color: 'from-genz-hot-pink to-genz-coral-pop',
    },
    {
      title: 'Daily Reset',
      icon: <BookOpen className="w-6 h-6" />,
      content: data?.daily_reset,
      color: 'from-genz-purple-haze to-genz-lavender-dream',
    },
    {
      title: 'Affirmations',
      icon: <Sparkles className="w-6 h-6" />,
      content: data?.affirmations,
      color: 'from-genz-neon-green to-genz-lime-zest',
    },
    {
      title: 'Integration',
      icon: <Heart className="w-6 h-6" />,
      content: data?.integration,
      color: 'from-genz-cyber-yellow to-genz-sunset-orange',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="genz-container py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/dashboard">
            <GenZButton variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </GenZButton>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <GenZBadge variant="neon">
              {data?.offline ? 'Fallback Mode' : 'Live'}
            </GenZBadge>
            <h1 className="genz-title">Karma Reset ✨</h1>
          </div>
          {data?.offline && data?.fallback_reason && (
            <p className="text-sm text-white/70 mb-2">
              Showing fallback guidance: {data.fallback_reason}
            </p>
          )}
          <p className="text-xl text-white/80">
            A guided reset plan to release patterns and restore balance
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GenZCard variant="neon" className="h-full">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${section.color} flex items-center justify-center mb-4`}>
                  {section.icon}
                </div>
                <h3 className="text-2xl font-display font-bold mb-4 text-white">
                  {section.title}
                </h3>
                {Array.isArray(section.content) ? (
                  <ul className="space-y-2">
                    {section.content.map((item: string, i: number) => (
                      <li key={i} className="text-white/80 flex items-start gap-2">
                        <span className="text-genz-electric-blue mt-1">•</span>
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : section.content ? (
                  <p className="text-white/80">{section.content}</p>
                ) : (
                  <CardSkeleton />
                )}
              </GenZCard>
            </motion.div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
