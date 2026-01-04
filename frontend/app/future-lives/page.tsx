'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Star, TrendingUp, Zap, Award, ArrowLeft, Loader2 } from 'lucide-react';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZButton from '../components/GenZButton';
import GenZBadge from '../components/GenZBadge';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { getItem, STORES } from '@/lib/storage';
import { futureLivesAPI, BirthDetails } from '@/lib/api';
import Link from 'next/link';

export default function FutureLivesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wisdomCards, setWisdomCards] = useState<any[]>([]);
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
    fetch('/data/wisdom_cards.json')
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((card: any) => 
          card.tradition === 'Nadi Jyotisha' ||
          card.tags.some((tag: string) => 
            tag.toLowerCase().includes('future') || 
            tag.toLowerCase().includes('moksha')
          )
        );
        setWisdomCards(filtered);
      })
      .catch(err => console.error('Error loading wisdom cards:', err));
  }, []);

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
        const prediction = await futureLivesAPI.getPrediction(birthDetails);
        setData(prediction);
      } catch (apiError) {
        console.error('API error, using offline mode:', apiError);
        setData({
          offline: true,
          predictions: 'Your future incarnations hold great potential for spiritual advancement and service to humanity.',
          evolution_path: 'Your soul is progressing toward higher consciousness and eventual liberation from the cycle of birth and death.',
          moksha_timeline: 'Based on your current spiritual trajectory, moksha is attainable within 3-5 lifetimes if you maintain your dharmic path.',
          future_missions: [
            'Spiritual teacher and guide for others',
            'Healer working with energy and consciousness',
            'Bridge between ancient wisdom and modern understanding',
            'Leader in consciousness evolution movements'
          ]
        });
      }
    } catch (error) {
      console.error('Error loading future lives:', error);
      setError('Failed to load future lives');
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
          <div className="text-white text-xl">Scanning future timelines...</div>
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
      title: 'Future Predictions',
      icon: <Star className="w-6 h-6" />,
      content: data?.predictions,
      color: 'from-genz-cyber-yellow to-genz-sunset-orange',
    },
    {
      title: 'Evolution Path',
      icon: <TrendingUp className="w-6 h-6" />,
      content: data?.evolution_path,
      color: 'from-genz-electric-blue to-genz-mint-fresh',
    },
    {
      title: 'Moksha Timeline',
      icon: <Award className="w-6 h-6" />,
      content: data?.moksha_timeline,
      color: 'from-genz-purple-haze to-genz-lavender-dream',
    },
    {
      title: 'Future Missions',
      icon: <Zap className="w-6 h-6" />,
      content: data?.future_missions,
      color: 'from-genz-neon-green to-genz-lime-zest',
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
            <h1 className="genz-title">Future Lives ⭐</h1>
          </div>
          <p className="text-xl text-white/80">
            Envision your soul's evolution and future paths
          </p>
        </motion.div>

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

        {data?.offline && wisdomCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl font-display font-bold mb-6 text-white">
              Nadi Jyotisha Wisdom
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wisdomCards.slice(0, 4).map((card, index) => (
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
