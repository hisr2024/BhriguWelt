'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, TrendingUp, Heart, Compass, ArrowLeft, Loader2 } from 'lucide-react';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZButton from '../components/GenZButton';
import GenZBadge from '../components/GenZBadge';
import BottomNav from '../components/BottomNav';
import CardSkeleton from '../components/CardSkeleton';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { getItem, STORES } from '@/lib/storage';
import { bhriguPredictionsAPI, BirthDetails } from '@/lib/api';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';
import Link from 'next/link';

export default function KarmicJourneyPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wisdomCards, setWisdomCards] = useState<any[]>([]);
  const [wisdomLoading, setWisdomLoading] = useState(true);
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const router = useRouter();

  // Redirect to passcode setup if encryption not configured
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

  // Load wisdom cards for offline mode
  useEffect(() => {
    const loadWisdomCards = async () => {
      try {
        setWisdomLoading(true);
        const res = await fetch('/data/wisdom_cards.json');
        const data = await res.json();
        // Filter by karmic-related tags and philosophy category
        const filtered = data.filter((card: any) => 
          card.category === 'philosophy' ||
          card.tags.some((tag: string) => 
            tag.toLowerCase().includes('karma') || 
            tag.toLowerCase().includes('soul')
          )
        );
        setWisdomCards(filtered);
      } catch (err) {
        console.error('Error loading wisdom cards:', err);
      } finally {
        setWisdomLoading(false);
      }
    };

    loadWisdomCards();
  }, []);

  // Load data
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

      // Get birth details from profile
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

      // Try to load from API
      try {
        const response = await bhriguPredictionsAPI.getKarmicJourney(birthDetails);
        const prediction = normalizePredictionResponse<any>(response).prediction;
        setData({
          ...prediction,
          soul_evolution: prediction?.evolution_stage ?? prediction?.spiritual_gifts ?? prediction?.karmic_blueprint,
          dharmic_path: prediction?.life_mission ?? prediction?.timing
        });
      } catch (apiError) {
        console.error('API error, using offline mode:', apiError);
        // Use offline wisdom cards
        setData({
          offline: true,
          soul_purpose: 'Your soul has chosen this lifetime to learn profound lessons about balance, compassion, and spiritual growth.',
          karmic_lessons: [
            'Learning to balance material and spiritual pursuits',
            'Developing emotional intelligence and empathy',
            'Understanding the power of forgiveness and letting go',
            'Cultivating inner peace amidst external chaos'
          ],
          soul_evolution: 'Your soul is on an ascending path, moving through challenges that will ultimately lead to greater wisdom and enlightenment.',
          dharmic_path: 'Your dharma involves serving others while maintaining your own spiritual practice and inner balance.'
        });
      }
    } catch (error) {
      console.error('Error loading karmic journey:', error);
      setError('Failed to load karmic journey');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking encryption status
  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Loading your karmic journey...</div>
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
      title: 'Soul Purpose',
      icon: <Sparkles className="w-6 h-6" />,
      content: data?.soul_purpose,
      color: 'from-genz-electric-blue to-genz-mint-fresh',
    },
    {
      title: 'Karmic Lessons',
      icon: <TrendingUp className="w-6 h-6" />,
      content: data?.karmic_lessons,
      color: 'from-genz-purple-haze to-genz-lavender-dream',
    },
    {
      title: 'Soul Evolution',
      icon: <Heart className="w-6 h-6" />,
      content: data?.soul_evolution,
      color: 'from-genz-hot-pink to-genz-coral-pop',
    },
    {
      title: 'Dharmic Path',
      icon: <Compass className="w-6 h-6" />,
      content: data?.dharmic_path,
      color: 'from-genz-cyber-yellow to-genz-sunset-orange',
    },
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
            <h1 className="genz-title">Karmic Journey ✨</h1>
          </div>
          <p className="text-xl text-white/80">
            Discover your soul's purpose and life mission
          </p>
        </motion.div>

        {/* Main Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                {Array.isArray(section.content) ? (
                  <ul className="space-y-2">
                    {section.content.map((item: string, i: number) => (
                      <li key={i} className="text-white/80 flex items-start gap-2">
                        <span className="text-genz-electric-blue mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/80">{section.content}</p>
                )}
              </GenZCard>
            </motion.div>
          ))}
        </div>

        {/* Wisdom Cards (Offline Mode) */}
        {data?.offline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl font-display font-bold mb-6 text-white">
              Karmic Wisdom
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wisdomLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <CardSkeleton key={index} />
                  ))
                : wisdomCards.slice(0, 4).map((card, index) => (
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
