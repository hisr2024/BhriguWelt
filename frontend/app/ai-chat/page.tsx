'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bot, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import AIChatInterface from '../components/AIChatInterface';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { getItem, STORES } from '@/lib/storage';

export default function AIChatPage() {
  const [birthChartData, setBirthChartData] = useState<any>(null);
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
      loadBirthChartData();
    }
  }, [encryptionKey]);

  const loadBirthChartData = async () => {
    if (!encryptionKey) return;

    try {
      const report = await getItem(STORES.REPORTS, 'current_birth_chart', encryptionKey);
      if (report && report.data) {
        setBirthChartData(report.data);
      } else {
        // Mock data for demonstration if no chart exists
        setBirthChartData({
          zodiac_sign: 'Leo',
          moon_sign: 'Taurus',
          ascendant: 'Aries',
          nakshatra: 'Rohini',
        });
      }
    } catch (error) {
      console.error('Error loading birth chart data:', error);
    }
  };

  if (encryptionLoading || !birthChartData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-white text-xl">Loading your cosmic guide...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="genz-container py-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <GenZButton variant="ghost" size="sm">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
          </GenZButton>

          <GenZBadge variant="neon" size="sm">
            Powered by OpenAI
          </GenZBadge>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <motion.div
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze flex items-center justify-center shadow-genz-glow"
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Bot className="w-12 h-12 text-white" />
          </motion.div>

          <GenZBadge variant="neon" className="mb-4">
            <Sparkles className="w-4 h-4 mr-2 inline" />
            AI Astrology Guide
          </GenZBadge>

          <h1 className="genz-title mb-4">Chat with AI Assistant</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Ask me anything about your cosmic journey, birth chart, or astrology. I'm here to provide personalized insights and guidance.
          </p>
        </motion.div>

        {/* Chat Interface */}
        <div className="max-w-5xl mx-auto">
          <div className="h-[calc(100vh-300px)] min-h-[600px]">
            <AIChatInterface
              birthChartData={birthChartData}
              context="general"
            />
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-electric-blue to-genz-mint-fresh flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Personalized Insights</h3>
            <p className="text-white/70 text-sm">
              Get AI-powered predictions based on your unique birth chart and planetary positions
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-purple-haze to-genz-lavender-dream flex items-center justify-center mb-4">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">24/7 Availability</h3>
            <p className="text-white/70 text-sm">
              Ask questions anytime and get instant, insightful answers from Vedic astrology expert AI
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-genz-hot-pink to-genz-coral-pop flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Ancient Wisdom</h3>
            <p className="text-white/70 text-sm">
              Powered by 5000+ years of Vedic knowledge combined with modern AI technology
            </p>
          </motion.div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
