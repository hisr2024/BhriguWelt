'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Star, Loader2, Users, Calendar, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { getItem, STORES } from '@/lib/storage';
import { api } from '@/lib/api';

interface MatchResult {
  total_score: number;
  max_score: number;
  percentage: number;
  recommendation: string;
  ashtakoot_details: {
    varna: { score: number; max:  number; description: string };
    vashya: { score: number; max: number; description: string };
    tara: { score: number; max: number; description: string };
    yoni: { score: number; max:  number; description: string };
    graha_maitri: { score: number; max: number; description: string };
    gana:  { score: number; max: number; description: string };
    bhakoot: { score: number; max:  number; description: string };
    nadi:  { score: number; max: number; description: string };
  };
  doshas: {
    mangal_dosha_person1: boolean;
    mangal_dosha_person2: boolean;
    nadi_dosha:  boolean;
  };
}

export default function MatchmakingPage() {
  const [step, setStep] = useState<'input' | 'loading' | 'result'>('input');
  const [person1, setPerson1] = useState({
    name: '',
    date_of_birth: '',
    time_of_birth: '',
    place_of_birth: '',
  });
  const [person2, setPerson2] = useState({
    name: '',
    date_of_birth: '',
    time_of_birth: '',
    place_of_birth: '',
  });
  const [result, setResult] = useState<MatchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useMyProfile, setUseMyProfile] = useState(false);
  const { encryptionKey, isSetup, isLoading:  encryptionLoading, isUnlocked } = useEncryption();
  const router = useRouter();

  useEffect(() => {
    if (!encryptionLoading && !isSetup) {
      router.push('/setup-passcode');
    }
  }, [encryptionLoading, isSetup, router]);

  useEffect(() => {
    if (! encryptionLoading && isSetup && ! isUnlocked) {
      router.push('/unlock');
    }
  }, [encryptionLoading, isSetup, isUnlocked, router]);

  // Load user's profile for Person 1 if checkbox is checked
  useEffect(() => {
    if (useMyProfile && encryptionKey) {
      loadMyProfile();
    }
  }, [useMyProfile, encryptionKey]);

  const loadMyProfile = async () => {
    if (! encryptionKey) return;
    
    try {
      const profile = await getItem(STORES. PROFILES, 'current_profile', encryptionKey);
      if (profile) {
        setPerson1({
          name: profile.name || 'Me',
          date_of_birth: profile.dateOfBirth || '',
          time_of_birth: profile. timeOfBirth || '',
          place_of_birth: profile.placeOfBirth || '',
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const calculateCompatibility = async () => {
    setStep('loading');
    setError(null);

    try {
      const response = await api.post('/api/matchmaking/compatibility', {
        person1: {
          ... person1,
          latitude: 0,
          longitude: 0,
        },
        person2: {
          ...person2,
          latitude: 0,
          longitude: 0,
        },
      });

      if (response.data.status === 'success') {
        setResult(response.data.data);
        setStep('result');
      } else {
        throw new Error(response.data.message || 'Failed to calculate compatibility');
      }
    } catch (err:  any) {
      console.error('Matchmaking error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to calculate compatibility');
      setStep('input');
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-400';
    if (percentage >= 50) return 'text-yellow-400';
    if (percentage >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreEmoji = (percentage: number) => {
    if (percentage >= 75) return '💚';
    if (percentage >= 50) return '💛';
    if (percentage >= 25) return '🧡';
    return '❤️‍🩹';
  };

  if (encryptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
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
          className="mb-8 text-center"
        >
          <motion.div
            className="text-7xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💕
          </motion.div>
          <GenZBadge variant="neon" size="lg" className="mb-4" pulse>
            💫 Kundali Matching
          </GenZBadge>
          <h1 className="genz-title mb-2">Cosmic Compatibility</h1>
          <p className="text-white/70">Ashtakoot Guna Milan - 36 Point System</p>
        </motion. div>

        {error && (
          <GenZCard variant="glass" className="mb-6 border-red-500/30">
            <p className="text-red-400 text-center">{error}</p>
          </GenZCard>
        )}

        {step === 'input' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Person 1 */}
            <GenZCard variant="gradient">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Person 1</h3>
                  <label className="flex items-center gap-2 text-sm text-white/70 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useMyProfile}
                      onChange={(e) => setUseMyProfile(e.target.checked)}
                      className="rounded"
                    />
                    Use my profile
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={person1.name}
                  onChange={(e) => setPerson1({ ...person1, name: e. target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50"
                />
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-white/50" />
                  <input
                    type="date"
                    value={person1.date_of_birth}
                    onChange={(e) => setPerson1({ ...person1, date_of_birth: e.target.value })}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-white/50" />
                  <input
                    type="time"
                    value={person1.time_of_birth}
                    onChange={(e) => setPerson1({ ...person1, time_of_birth: e.target.value })}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    placeholder="Place of Birth"
                    value={person1.place_of_birth}
                    onChange={(e) => setPerson1({ ...person1, place_of_birth:  e.target.value })}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50"
                  />
                </div>
              </div>
            </GenZCard>

            {/* Person 2 */}
            <GenZCard variant="gradient">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Person 2</h3>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Name"
                  value={person2.name}
                  onChange={(e) => setPerson2({ ... person2, name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50"
                />
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-white/50" />
                  <input
                    type="date"
                    value={person2.date_of_birth}
                    onChange={(e) => setPerson2({ ...person2, date_of_birth: e.target. value })}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-white/50" />
                  <input
                    type="time"
                    value={person2.time_of_birth}
                    onChange={(e) => setPerson2({ ...person2, time_of_birth: e.target.value })}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    placeholder="Place of Birth"
                    value={person2.place_of_birth}
                    onChange={(e) => setPerson2({ ...person2, place_of_birth:  e.target.value })}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50"
                  />
                </div>
              </div>
            </GenZCard>

            {/* Calculate Button */}
            <div className="lg:col-span-2 text-center">
              <GenZButton
                variant="primary"
                size="lg"
                onClick={calculateCompatibility}
                disabled={! person1.date_of_birth || !person2.date_of_birth}
                className="px-12"
              >
                <Heart className="w-5 h-5 mr-2" />
                Calculate Compatibility
              </GenZButton>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <GenZCard variant="glass" className="text-center py-16">
            <Loader2 className="w-16 h-16 text-pink-500 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-2">Analyzing Cosmic Connection...</h2>
            <p className="text-white/70">Calculating Ashtakoot compatibility</p>
          </GenZCard>
        )}

        {step === 'result' && result && (
          <div className="space-y-6">
            {/* Main Score */}
            <GenZCard variant="gradient" className="text-center py-8">
              <div className="text-6xl mb-4">{getScoreEmoji(result.percentage)}</div>
              <h2 className={`text-5xl font-bold mb-2 ${getScoreColor(result. percentage)}`}>
                {result.percentage. toFixed(1)}%
              </h2>
              <p className="text-xl text-white mb-2">
                {result.total_score} / {result.max_score} Points
              </p>
              <p className="text-white/80 max-w-lg mx-auto">{result.recommendation}</p>
            </GenZCard>

            {/* Ashtakoot Breakdown */}
            <GenZCard variant="glass">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                Ashtakoot Analysis
              </h3>
              <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
                {result.ashtakoot_details && Object.entries(result.ashtakoot_details).map(([key, value]) => (
                  <div key={key} className="bg-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-medium capitalize">
                        {key.replace('_', ' ')}
                      </span>
                      <span className={`font-bold ${value.score === value.max ? 'text-green-400' : value.score > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {value.score}/{value.max}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                      <div
                        className={`h-2 rounded-full ${value.score === value.max ? 'bg-green-500' : value.score > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${(value.score / value.max) * 100}%` }}
                      />
                    </div>
                    <p className="text-white/60 text-sm">{value.description}</p>
                  </div>
                ))}
              </div>
            </GenZCard>

            {/* Doshas */}
            {result.doshas && (
              <GenZCard variant="neon">
                <h3 className="text-xl font-bold text-white mb-4">Dosha Analysis</h3>
                <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
                  <div className={`p-4 rounded-xl ${result.doshas.mangal_dosha_person1 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                    <p className="text-white font-medium">Mangal Dosha (Person 1)</p>
                    <p className={result.doshas.mangal_dosha_person1 ? 'text-red-400' : 'text-green-400'}>
                      {result.doshas.mangal_dosha_person1 ? 'Present' : 'Not Present'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${result. doshas.mangal_dosha_person2 ? 'bg-red-500/20' :  'bg-green-500/20'}`}>
                    <p className="text-white font-medium">Mangal Dosha (Person 2)</p>
                    <p className={result. doshas.mangal_dosha_person2 ? 'text-red-400' : 'text-green-400'}>
                      {result.doshas. mangal_dosha_person2 ? 'Present' : 'Not Present'}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${result.doshas.nadi_dosha ?  'bg-red-500/20' : 'bg-green-500/20'}`}>
                    <p className="text-white font-medium">Nadi Dosha</p>
                    <p className={result.doshas.nadi_dosha ?  'text-red-400' : 'text-green-400'}>
                      {result. doshas.nadi_dosha ? 'Present' : 'Not Present'}
                    </p>
                  </div>
                </div>
              </GenZCard>
            )}

            {/* Try Again */}
            <div className="text-center">
              <GenZButton variant="outline" size="lg" onClick={() => setStep('input')}>
                Check Another Match
              </GenZButton>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
