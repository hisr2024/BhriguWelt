'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowLeft, Moon, Sun, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { STORES } from '@/lib/storage';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { bhriguPredictionsAPI, BirthDetails } from '@/lib/api';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';

export default function HoroscopePage() {
  const [predictions, setPredictions] = useState<any[]>([]);
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
      loadHoroscopePredictions();
    }
  }, [encryptionKey]);

  const loadHoroscopePredictions = async () => {
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

      // Load all four predictions in parallel
      try {
        const response = await bhriguPredictionsAPI.getPredictions(birthDetails);
        const prediction = normalizePredictionResponse<any>(response).prediction;

        setPredictions([
          { 
            period: 'Today', 
            icon: <Sun className="w-6 h-6" />, 
            color: 'from-genz-cyber-yellow to-genz-sunset-orange', 
            text: extractPredictionText(prediction?.daily) 
          },
          { 
            period: 'This Week', 
            icon: <Moon className="w-6 h-6" />, 
            color: 'from-genz-purple-haze to-genz-lavender-dream', 
            text: extractPredictionText(prediction?.weekly) 
          },
          { 
            period: 'This Month', 
            icon: <Star className="w-6 h-6" />, 
            color: 'from-genz-electric-blue to-genz-mint-fresh', 
            text: extractPredictionText(prediction?.monthly) 
          },
          { 
            period: 'This Year', 
            icon: <Zap className="w-6 h-6" />, 
            color: 'from-genz-hot-pink to-genz-coral-pop', 
            text: extractPredictionText(prediction?.yearly) 
          },
        ]);
      } catch (apiError) {
        console.error('API error, using offline fallback:', apiError);
        setPredictions(getOfflinePredictions());
      }
    } catch (error) {
      console.error('Error loading horoscope:', error);
      setError('Failed to load horoscope');
    } finally {
      setLoading(false);
    }
  };

  const extractPredictionText = (prediction: string | undefined): string => {
    const text = prediction ?? '';

    // Get first 150 characters
    if (text.length > 150) {
      return text.substring(0, 150) + '...';
    }
    return text || 'Cosmic energies are aligning in your favor.';
  };

  const getOfflinePredictions = () => {
    return [
      { 
        period: 'Today', 
        icon: <Sun className="w-6 h-6" />, 
        color: 'from-genz-cyber-yellow to-genz-sunset-orange', 
        text: 'A day of new beginnings and opportunities! The Sun illuminates your path forward.' 
      },
      { 
        period: 'This Week', 
        icon: <Moon className="w-6 h-6" />, 
        color: 'from-genz-purple-haze to-genz-lavender-dream', 
        text: 'Focus on personal growth and relationships. The Moon guides your emotional journey.' 
      },
      { 
        period: 'This Month', 
        icon: <Star className="w-6 h-6" />, 
        color: 'from-genz-electric-blue to-genz-mint-fresh', 
        text: 'Career advancement and financial gains ahead. Jupiter brings expansion.' 
      },
      { 
        period: 'This Year', 
        icon: <Zap className="w-6 h-6" />, 
        color: 'from-genz-hot-pink to-genz-coral-pop', 
        text: 'Major life transformations and soul evolution. Saturn teaches profound lessons.' 
      },
    ];
  };

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

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="genz-container py-8 relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <GenZButton variant="ghost" size="sm">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
          </GenZButton>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <GenZBadge variant="neon" size="lg" className="mb-6">
            🌙 Horoscope
          </GenZBadge>
          <h1 className="genz-title mb-4">
            Your Predictions
          </h1>
          <p className="text-xl text-white/80">
            Cosmic guidance for your journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.map((pred, index) => (
            <GenZCard key={index} variant="glass" className="group">
              <div className="flex items-start gap-4">
                <motion.div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${pred.color} flex items-center justify-center shadow-genz-glow flex-shrink-0`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  {pred.icon}
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-genz-electric-blue transition-colors">
                    {pred.period}
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    {pred.text}
                  </p>
                </div>
              </div>
            </GenZCard>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
