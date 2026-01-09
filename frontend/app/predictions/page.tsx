'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Compass, Sun, Calendar, TrendingUp, ArrowLeft, Loader2 } from 'lucide-react';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZButton from '../components/GenZButton';
import GenZBadge from '../components/GenZBadge';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { getItem, setItem, STORES } from '@/lib/storage';
import { predictionsAPI, BirthDetails } from '@/lib/api';
import Link from 'next/link';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

export default function PredictionsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [wisdomCards, setWisdomCards] = useState<any[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [syncWhenOnline, setSyncWhenOnline] = useState(true);
  const [cacheTimestamp, setCacheTimestamp] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const router = useRouter();
  const isOnline = useOnlineStatus();

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
          card.category === 'astrology' ||
          card.tags.some((tag: string) => 
            ['sun', 'moon', 'mars', 'jupiter', 'venus', 'saturn', 'mercury'].includes(tag.toLowerCase())
          )
        );
        setWisdomCards(filtered);
      })
      .catch(err => console.error('Error loading wisdom cards:', err));
  }, []);

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

  const loadData = useCallback(async () => {
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

      const cacheKey = `predictions_cache_${activeTab}`;
      const offlineMode = !isOnline;
      setIsOffline(offlineMode);

      if (offlineMode) {
        const cached = await getItem(STORES.SETTINGS, cacheKey, encryptionKey);
        if (cached?.data) {
          setData({ ...cached.data, offline: true });
          setCacheTimestamp(cached.fetchedAt);
          setUsingCache(true);
        } else {
          setData({
            offline: true,
            overall: getOfflinePrediction(activeTab),
            career: getOfflineCareerPrediction(activeTab),
            love: getOfflineLovePrediction(activeTab),
            health: getOfflineHealthPrediction(activeTab),
            finance: getOfflineFinancePrediction(activeTab),
            lucky_color: getLuckyColor(),
            lucky_number: Math.floor(Math.random() * 9) + 1,
            advice: getOfflineAdvice(activeTab)
          });
          setCacheTimestamp(null);
          setUsingCache(false);
        }
        return;
      }

      try {
        let prediction;
        switch (activeTab) {
          case 'daily':
            prediction = await predictionsAPI.getDaily(birthDetails);
            break;
          case 'weekly':
            prediction = await predictionsAPI.getWeekly(birthDetails);
            break;
          case 'monthly':
            prediction = await predictionsAPI.getMonthly(birthDetails);
            break;
          case 'yearly':
            prediction = await predictionsAPI.getYearly(birthDetails);
            break;
        }
        setData(prediction);
        setCacheTimestamp(null);
        setUsingCache(false);
        setIsOffline(false);
        await setItem(
          STORES.SETTINGS,
          cacheKey,
          { data: prediction, fetchedAt: new Date().toISOString() },
          encryptionKey
        );
      } catch (apiError) {
        console.error('API error, using offline mode:', apiError);
        const cached = await getItem(STORES.SETTINGS, cacheKey, encryptionKey);
        if (cached?.data) {
          setData({ ...cached.data, offline: true });
          setCacheTimestamp(cached.fetchedAt);
          setUsingCache(true);
        } else {
          setData({
            offline: true,
            overall: getOfflinePrediction(activeTab),
            career: getOfflineCareerPrediction(activeTab),
            love: getOfflineLovePrediction(activeTab),
            health: getOfflineHealthPrediction(activeTab),
            finance: getOfflineFinancePrediction(activeTab),
            lucky_color: getLuckyColor(),
            lucky_number: Math.floor(Math.random() * 9) + 1,
            advice: getOfflineAdvice(activeTab)
          });
          setCacheTimestamp(null);
          setUsingCache(false);
        }
        setIsOffline(true);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
      setError('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, [activeTab, encryptionKey, isOnline]);

  useEffect(() => {
    if (encryptionKey) {
      loadData();
    }
  }, [encryptionKey, activeTab, loadData]);

  useEffect(() => {
    setIsOffline(!isOnline);
    if (isOnline && syncWhenOnline && encryptionKey) {
      loadData();
    }
  }, [isOnline, syncWhenOnline, encryptionKey, loadData]);

  const getOfflinePrediction = (period: string) => {
    const predictions: Record<string, string> = {
      daily: 'Today brings opportunities for growth and new beginnings. Stay open to unexpected possibilities.',
      weekly: 'This week focuses on personal development and relationships. Balance work with self-care.',
      monthly: 'This month offers significant progress in career and personal goals. Stay focused and persistent.',
      yearly: 'This year is transformative, bringing major life changes and spiritual growth. Embrace the journey.'
    };
    return predictions[period];
  };

  const getOfflineCareerPrediction = (period: string) => {
    const predictions: Record<string, string> = {
      daily: 'Good day for professional networking and showcasing your skills.',
      weekly: 'Career advancement opportunities may arise. Be prepared to take initiative.',
      monthly: 'Significant professional growth expected. New projects or responsibilities likely.',
      yearly: 'Career transformation year. Major achievements and recognition possible.'
    };
    return predictions[period];
  };

  const getOfflineLovePrediction = (period: string) => {
    const predictions: Record<string, string> = {
      daily: 'Romantic energy is high. Good time for heart-to-heart conversations.',
      weekly: 'Relationships deepen. Singles may meet someone interesting.',
      monthly: 'Love life flourishes. Existing relationships strengthen significantly.',
      yearly: 'Transformative year for relationships. Major commitments possible.'
    };
    return predictions[period];
  };

  const getOfflineHealthPrediction = (period: string) => {
    const predictions: Record<string, string> = {
      daily: 'Energy levels are good. Focus on hydration and rest.',
      weekly: 'Overall wellness is positive. Good time to start new fitness routines.',
      monthly: 'Health remains stable. Regular exercise enhances vitality.',
      yearly: 'Year of improved health and wellness. Focus on preventive care.'
    };
    return predictions[period];
  };

  const getOfflineFinancePrediction = (period: string) => {
    const predictions: Record<string, string> = {
      daily: 'Financially stable day. Avoid impulse purchases.',
      weekly: 'Financial opportunities may arise. Stay alert to possibilities.',
      monthly: 'Income growth potential. Good time for financial planning.',
      yearly: 'Financial improvements expected. Wise investments pay off.'
    };
    return predictions[period];
  };

  const getLuckyColor = () => {
    const colors = ['Blue', 'Green', 'Yellow', 'Red', 'Purple', 'White', 'Orange'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getOfflineAdvice = (period: string) => {
    const advice: Record<string, string[]> = {
      daily: [
        'Start your day with meditation',
        'Practice gratitude',
        'Stay positive and focused'
      ],
      weekly: [
        'Set clear intentions',
        'Balance work and personal life',
        'Connect with loved ones'
      ],
      monthly: [
        'Review and adjust your goals',
        'Invest in self-development',
        'Build meaningful relationships'
      ],
      yearly: [
        'Embrace change and transformation',
        'Focus on long-term goals',
        'Cultivate spiritual practices'
      ]
    };
    return advice[period];
  };

  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Loading predictions...</div>
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

  const tabs = [
    { id: 'daily', label: 'Daily', icon: <Sun className="w-4 h-4" /> },
    { id: 'weekly', label: 'Weekly', icon: <Calendar className="w-4 h-4" /> },
    { id: 'monthly', label: 'Monthly', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'yearly', label: 'Yearly', icon: <Compass className="w-4 h-4" /> },
  ];

  const sections = [
    { title: 'Career', content: data?.career, color: 'from-genz-electric-blue to-genz-mint-fresh' },
    { title: 'Love', content: data?.love, color: 'from-genz-hot-pink to-genz-coral-pop' },
    { title: 'Health', content: data?.health, color: 'from-genz-neon-green to-genz-lime-zest' },
    { title: 'Finance', content: data?.finance, color: 'from-genz-cyber-yellow to-genz-sunset-orange' },
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
            <h1 className="genz-title">Predictions 🔮</h1>
          </div>
          <p className="text-xl text-white/80">
            Forecasts with actionable insights
          </p>
        </motion.div>

        {usingCache && cacheTimestamp && (
          <GenZCard variant="glass" className="mb-6 border border-genz-electric-blue/40">
            <div className="flex flex-col gap-2 text-white/90">
              <span className="font-semibold">Offline cache in use</span>
              <span className="text-sm text-white/70">
                Showing your last saved prediction from {new Date(cacheTimestamp).toLocaleString()}.
              </span>
            </div>
          </GenZCard>
        )}

        <GenZCard variant="glass" className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-white font-semibold">Sync when online</p>
              <p className="text-white/70 text-sm">
                Automatically refresh cached predictions when you regain connectivity.
              </p>
            </div>
            <label className="flex items-center gap-2 text-white">
              <span className="text-sm">{syncWhenOnline ? 'On' : 'Off'}</span>
              <input
                type="checkbox"
                checked={syncWhenOnline}
                onChange={async (event) => {
                  const nextValue = event.target.checked;
                  setSyncWhenOnline(nextValue);
                  if (encryptionKey) {
                    await setItem(
                      STORES.SETTINGS,
                      'predictions_sync_when_online',
                      nextValue,
                      encryptionKey
                    );
                  }
                  if (nextValue && isOffline === false) {
                    loadData();
                  }
                }}
                className="h-5 w-5 accent-genz-electric-blue"
              />
            </label>
          </div>
        </GenZCard>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <GenZButton
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              {tab.icon}
              {tab.label}
            </GenZButton>
          ))}
        </div>

        {/* Overall Prediction */}
        {data?.overall && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <GenZCard variant="gradient" className="bg-gradient-to-br from-genz-purple-haze/20 to-genz-electric-blue/20">
              <h3 className="text-2xl font-display font-bold mb-4 text-white">
                Overall Prediction
              </h3>
              <p className="text-white/80 text-lg">{data.overall}</p>
            </GenZCard>
          </motion.div>
        )}

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GenZCard variant="neon">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${section.color} flex items-center justify-center mb-3`}>
                  <span className="text-2xl">{['💼', '💖', '🏃', '💰'][index]}</span>
                </div>
                <h3 className="text-xl font-display font-bold mb-3 text-white">
                  {section.title}
                </h3>
                <p className="text-white/80">{section.content}</p>
              </GenZCard>
            </motion.div>
          ))}
        </div>

        {/* Lucky Elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 gap-4">
            <GenZCard variant="glass" className="text-center">
              <h4 className="text-lg font-bold mb-2 text-white">Lucky Color</h4>
              <p className="text-3xl font-display font-bold bg-gradient-to-r from-genz-electric-blue to-genz-hot-pink bg-clip-text text-transparent">
                {data?.lucky_color}
              </p>
            </GenZCard>
            <GenZCard variant="glass" className="text-center">
              <h4 className="text-lg font-bold mb-2 text-white">Lucky Number</h4>
              <p className="text-3xl font-display font-bold bg-gradient-to-r from-genz-cyber-yellow to-genz-sunset-orange bg-clip-text text-transparent">
                {data?.lucky_number}
              </p>
            </GenZCard>
          </div>
        </motion.div>

        {/* Advice */}
        {data?.advice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <GenZCard variant="neon">
              <h3 className="text-2xl font-display font-bold mb-4 text-white">
                Guidance
              </h3>
              <ul className="space-y-2">
                {data.advice.map((item: string, i: number) => (
                  <li key={i} className="text-white/80 flex items-start gap-2">
                    <span className="text-genz-electric-blue mt-1">✨</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </GenZCard>
          </motion.div>
        )}

        {/* Wisdom Cards */}
        {data?.offline && wisdomCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-3xl font-display font-bold mb-6 text-white">
              Astrological Wisdom
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
