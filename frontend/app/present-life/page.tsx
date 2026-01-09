'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sun, Briefcase, Heart, Activity, DollarSign, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZButton from '../components/GenZButton';
import GenZBadge from '../components/GenZBadge';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { getItem, STORES } from '@/lib/storage';
import { presentLifeAPI, BirthDetails } from '@/lib/api';
import { useOfflineWisdomCards } from '@/lib/wisdom';
import Link from 'next/link';

export default function PresentLifePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const router = useRouter();

  const { cards: wisdomCards } = useOfflineWisdomCards({ limit: 6 });

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

      const profile = await getItem(STORES.PROFILES, 'current_profile', encryptionKey);
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
        const analysis = await presentLifeAPI.getComprehensiveAnalysis(birthDetails);
        setData(analysis);
      } catch (apiError) {
        console.error('API error, using offline mode:', apiError);
        setData({
          offline: true,
          comprehensive_analysis: 'Your present life is a unique blend of opportunities and challenges designed to accelerate your spiritual growth.',
          career: 'Strong potential in leadership, creative fields, or teaching. Your natural abilities shine in roles where you can inspire and guide others.',
          relationships: 'Deep connections are important to you. Focus on authentic communication and emotional vulnerability.',
          health: 'Overall vitality is strong. Pay attention to stress management and maintaining work-life balance.',
          financial: 'Financial growth through career advancement and wise investments. Avoid impulsive spending.',
          spiritual_growth: 'This lifetime offers tremendous potential for spiritual awakening. Regular meditation and self-reflection are key.'
        });
      }
    } catch (error) {
      console.error('Error loading present life:', error);
      setError('Failed to load present life analysis');
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
          <div className="text-white text-xl">Analyzing your present life...</div>
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
      title: 'Career',
      icon: <Briefcase className="w-6 h-6" />,
      content: data?.career,
      color: 'from-genz-electric-blue to-genz-mint-fresh',
    },
    {
      title: 'Relationships',
      icon: <Heart className="w-6 h-6" />,
      content: data?.relationships,
      color: 'from-genz-hot-pink to-genz-coral-pop',
    },
    {
      title: 'Health',
      icon: <Activity className="w-6 h-6" />,
      content: data?.health,
      color: 'from-genz-neon-green to-genz-lime-zest',
    },
    {
      title: 'Financial',
      icon: <DollarSign className="w-6 h-6" />,
      content: data?.financial,
      color: 'from-genz-cyber-yellow to-genz-sunset-orange',
    },
    {
      title: 'Spiritual Growth',
      icon: <Sparkles className="w-6 h-6" />,
      content: data?.spiritual_growth,
      color: 'from-genz-purple-haze to-genz-lavender-dream',
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
              {data?.offline ? 'Offline Mode' : 'Live'}
            </GenZBadge>
            <h1 className="genz-title">Present Life ☀️</h1>
          </div>
          <p className="text-xl text-white/80">
            Comprehensive analysis of your current life path
          </p>
        </motion.div>

        {data?.comprehensive_analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <GenZCard variant="gradient" className="bg-gradient-to-br from-genz-electric-blue/20 to-genz-purple-haze/20">
              <h3 className="text-2xl font-display font-bold mb-4 text-white">
                Overview
              </h3>
              <p className="text-white/80 text-lg">{data.comprehensive_analysis}</p>
            </GenZCard>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
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
                <p className="text-white/80">{section.content}</p>
              </GenZCard>
            </motion.div>
          ))}
        </div>

        {data?.offline && wisdomCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl font-display font-bold mb-6 text-white">
              Wisdom Cards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wisdomCards.slice(0, 6).map((card, index) => (
                <GenZCard key={index} variant="glass">
                  <GenZBadge variant="default" size="sm" className="mb-3">
                    {card.tradition}
                  </GenZBadge>
                  <h4 className="text-xl font-bold mb-2 text-white">{card.title}</h4>
                  <p className="text-white/70 text-sm">{card.content}</p>
                </GenZCard>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
