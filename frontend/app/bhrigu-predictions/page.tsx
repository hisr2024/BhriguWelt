'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sparkles,
  History,
  TrendingUp,
  Sun,
  Calendar,
  Heart,
  Activity,
  Target
} from 'lucide-react';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import type { Profile } from '@/lib/types';

/**
 * Bhrigu Predictions Page
 * Comprehensive predictions based on ancient Vedic wisdom
 * All categories under passcode protection with caching
 */

interface CategoryCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  category: string;
  onClick: () => void;
}

const CategoryCard = ({ icon, title, description, badge, category, onClick }: CategoryCardProps) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -4 }}
    whileTap={{ scale: 0.98 }}
    className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm
               border border-cyan-500/20 rounded-2xl p-6 cursor-pointer
               hover:border-cyan-400/40 transition-all duration-300 group"
    onClick={onClick}
  >
    {badge && (
      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500
                      text-white text-xs font-bold px-3 py-1 rounded-full">
        {badge}
      </div>
    )}

    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20
                      rounded-xl flex items-center justify-center
                      group-hover:from-cyan-400/30 group-hover:to-blue-400/30 transition-all">
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-400 leading-relaxed">
          {description}
        </p>
        <div className="mt-3 flex items-center text-cyan-400 text-sm font-medium">
          <span>Explore</span>
          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function BhriguPredictionsPage() {
  const router = useRouter();
  const { getAllProfiles } = useEncryptedStorage();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProfileReady, setIsProfileReady] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (!isProfileReady) return;
    startSession();
  }, [isProfileReady]);

  const loadProfiles = async () => {
    try {
      const loadedProfiles = await getAllProfiles();
      setProfiles(loadedProfiles);
      if (loadedProfiles.length > 0) {
        setSelectedProfile(loadedProfiles[0]);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setIsProfileReady(true);
    }
  };

  const startSession = async () => {
    try {
      const response = await bhriguPredictionsAPI.startSession();
      setSessionId(response.data.session_id);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const categories = [
    {
      id: 'karmic-journey',
      icon: <Target className="w-7 h-7 text-cyan-400" />,
      title: 'Karmic Journey',
      description: 'Discover your soul\'s purpose and life mission through detailed karmic analysis',
      badge: 'New',
      route: '/bhrigu-predictions/karmic-journey'
    },
    {
      id: 'past-lives',
      icon: <History className="w-7 h-7 text-purple-400" />,
      title: 'Past Lives',
      description: 'Explore your previous incarnations and karmic patterns across lifetimes',
      badge: '',
      route: '/bhrigu-predictions/past-lives'
    },
    {
      id: 'future-lives',
      icon: <TrendingUp className="w-7 h-7 text-orange-400" />,
      title: 'Future Lives',
      description: 'Envision your soul\'s evolution and future birth paths with AI-powered predictions',
      badge: 'AI Powered',
      route: '/bhrigu-predictions/future-lives'
    },
    {
      id: 'present-life',
      icon: <Sun className="w-7 h-7 text-yellow-400" />,
      title: 'Present Life',
      description: 'Comprehensive analysis of your current life path and opportunities',
      badge: '',
      route: '/bhrigu-predictions/present-life'
    },
    {
      id: 'life-events',
      icon: <Calendar className="w-7 h-7 text-green-400" />,
      title: 'Life Events',
      description: 'Predict major life transitions and transitions with precision timing',
      badge: '',
      route: '/bhrigu-predictions/life-events'
    },
    {
      id: 'karmic-remedies',
      icon: <Sparkles className="w-7 h-7 text-pink-400" />,
      title: 'Karmic Remedies',
      description: 'Personalized spiritual practices and remedies for balance',
      badge: '',
      route: '/bhrigu-predictions/karmic-remedies'
    },
    {
      id: 'relationships',
      icon: <Heart className="w-7 h-7 text-red-400" />,
      title: 'Relationships',
      description: 'Soul connections and compatibility analysis for deeper bonds',
      badge: '',
      route: '/bhrigu-predictions/relationships'
    },
    {
      id: 'predictions',
      icon: <Activity className="w-7 h-7 text-blue-400" />,
      title: 'Predictions',
      description: 'Daily, weekly, and monthly forecasts with actionable insights',
      badge: '',
      route: '/bhrigu-predictions/predictions'
    }
  ];

  const handleCategoryClick = (category: typeof categories[0]) => {
    if (!selectedProfile) {
      alert('Please create a profile first to access Bhrigu predictions');
      router.push('/profile');
      return;
    }
    router.push(category.route);
  };

  if (!isProfileReady) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse space-y-8">
            <div className="h-8 w-40 bg-gray-700/60 rounded-full" />
            <div className="h-12 w-3/4 bg-gray-700/60 rounded-xl" />
            <div className="h-6 w-2/3 bg-gray-700/60 rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="h-36 bg-gray-800/60 border border-cyan-500/10 rounded-2xl"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20
                          border border-cyan-500/30 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-sm font-semibold text-cyan-400">New Features</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400
                         bg-clip-text text-transparent">
              Explore Your Cosmic Blueprint
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Comprehensive astrological insights powered by{' '}
              <span className="text-cyan-400 font-semibold">OpenAI</span>{' '}
              and ancient Vedic knowledge
            </p>
          </motion.div>
        </div>
      </div>

      {/* Profile Selector */}
      {profiles.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-4"
          >
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Select Profile
            </label>
            <select
              value={selectedProfile?.id || ''}
              onChange={(e) => {
                const profile = profiles.find(p => p.id === Number(e.target.value));
                setSelectedProfile(profile || null);
              }}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3
                       text-white focus:outline-none focus:border-cyan-400 transition-colors"
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} - {profile.dateOfBirth}
                </option>
              ))}
            </select>
          </motion.div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <CategoryCard
                {...category}
                category={category.id}
                onClick={() => handleCategoryClick(category)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Cache Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>
              Powered by Bhrigu Samhita & Nadi Jyotisa ancient wisdom
            </span>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            All predictions are cached locally for offline access and to expand our knowledge base
          </p>
        </motion.div>
      </div>
    </div>
  );
}
