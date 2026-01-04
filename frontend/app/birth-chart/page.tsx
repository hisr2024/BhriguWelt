'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Star, Moon, Sun, ArrowLeft, MessageSquare, Eye, Download } from 'lucide-react';
import Link from 'next/link';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import BirthChartVisualization from '../components/BirthChartVisualization';
import AIChatInterface from '../components/AIChatInterface';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { getItem, STORES } from '@/lib/storage';
import { useRouter } from 'next/navigation';

export default function BirthChartPage() {
  const [chartData, setChartData] = useState<any>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'details' | 'interpretation'>('chart');
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

  // Load birth chart data from encrypted storage
  useEffect(() => {
    if (encryptionKey) {
      loadChartData();
    }
  }, [encryptionKey]);

  const loadChartData = async () => {
    if (!encryptionKey) return;

    try {
      const report = await getItem(STORES.REPORTS, 'current_birth_chart', encryptionKey);
      if (report && report.data) {
        setChartData(report.data);
      } else {
        // Mock data for demonstration
        setChartData({
          ascendant: 'Aries',
          zodiac_sign: 'Leo',
          moon_sign: 'Taurus',
          nakshatra: 'Rohini',
          planets: [
            { name: 'Sun', position: 120, sign: 'Leo', house: 5, retrograde: false },
            { name: 'Moon', position: 45, sign: 'Taurus', house: 2, retrograde: false },
            { name: 'Mercury', position: 135, sign: 'Virgo', house: 6, retrograde: true },
            { name: 'Venus', position: 200, sign: 'Libra', house: 7, retrograde: false },
            { name: 'Mars', position: 90, sign: 'Cancer', house: 4, retrograde: false },
            { name: 'Jupiter', position: 270, sign: 'Capricorn', house: 10, retrograde: false },
            { name: 'Saturn', position: 315, sign: 'Aquarius', house: 11, retrograde: false },
            { name: 'Rahu', position: 180, sign: 'Libra', house: 7, retrograde: false },
            { name: 'Ketu', position: 0, sign: 'Aries', house: 1, retrograde: false },
          ],
          houses: Array.from({ length: 12 }, (_, i) => (i * 30)),
        });
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  // Show loading while checking encryption status
  if (encryptionLoading || !chartData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-white text-xl">Loading your cosmic blueprint...</div>
      </div>
    );
  }

  const planetDetails = chartData.planets || [];

  const interpretations = {
    sun: `Your Sun in ${chartData.zodiac_sign || 'Leo'} reveals your core essence and life force. This placement indicates strong leadership qualities, creativity, and a natural magnetism. You're meant to shine and inspire others.`,
    moon: `Moon in ${chartData.moon_sign || 'Taurus'} shows your emotional nature and inner world. You seek stability and comfort in relationships, and have a deep appreciation for beauty and sensory pleasures.`,
    ascendant: `${chartData.ascendant || 'Aries'} rising shapes how you present yourself to the world. You come across as confident, pioneering, and action-oriented. First impressions matter to you.`,
    overall: `Your birth chart reveals a unique blend of fire and earth energies, combining passion with practicality. The planetary positions at your birth time create a blueprint for your soul's journey in this lifetime.`
  };

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
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <GenZBadge variant="neon" size="lg" className="mb-6">
            ✨ Birth Chart
          </GenZBadge>
          <h1 className="genz-title mb-4">
            Your Cosmic Blueprint
          </h1>
          <p className="text-xl text-white/80">
            Explore the planetary positions at your birth
          </p>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <GenZButton
            variant={showAIChat ? 'primary' : 'outline'}
            size="lg"
            onClick={() => setShowAIChat(!showAIChat)}
            className="group"
          >
            <MessageSquare className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            {showAIChat ? 'Hide' : 'Ask'} AI Guide
          </GenZButton>
          <GenZButton
            variant="outline"
            size="lg"
            className="group"
          >
            <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
            Export PDF
          </GenZButton>
        </div>

        {/* AI Chat Interface */}
        <AnimatePresence>
          {showAIChat && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-12"
            >
              <div className="h-[600px]">
                <AIChatInterface
                  birthChartData={chartData}
                  context="birth-chart"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto">
          {['chart', 'details', 'interpretation'].map((tab) => (
            <GenZButton
              key={tab}
              variant={activeTab === tab ? 'primary' : 'ghost'}
              size="md"
              onClick={() => setActiveTab(tab as any)}
              className="capitalize"
            >
              {tab === 'chart' && <Eye className="w-4 h-4 mr-2" />}
              {tab === 'details' && <Star className="w-4 h-4 mr-2" />}
              {tab === 'interpretation' && <Sparkles className="w-4 h-4 mr-2" />}
              {tab}
            </GenZButton>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'chart' && (
            <motion.div
              key="chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-12"
            >
              <BirthChartVisualization chartData={chartData} size={600} />
            </motion.div>
          )}

          {activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="genz-heading mb-8 text-center">
                Planetary Positions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {planetDetails.map((planet: any, index: number) => (
                  <GenZCard key={index} variant="glass" className="group">
                    <div className="flex items-center gap-4">
                      <motion.div
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze flex items-center justify-center shadow-genz-glow`}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        {planet.name === 'Sun' && <Sun className="w-8 h-8" />}
                        {planet.name === 'Moon' && <Moon className="w-8 h-8" />}
                        {!['Sun', 'Moon'].includes(planet.name) && <Star className="w-8 h-8" />}
                      </motion.div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-display font-bold text-white group-hover:text-genz-electric-blue transition-colors">
                            {planet.name}
                          </h3>
                          {planet.retrograde && (
                            <GenZBadge variant="neon" size="sm">R</GenZBadge>
                          )}
                        </div>
                        <p className="text-white/70">
                          {planet.sign} • House {planet.house}
                        </p>
                        <p className="text-genz-electric-blue text-sm mt-1">
                          {planet.position.toFixed(2)}°
                        </p>
                      </div>
                    </div>
                  </GenZCard>
                ))}
              </div>

              {/* Key Points */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GenZCard variant="gradient" className="text-center">
                  <Sun className="w-12 h-12 mx-auto mb-4 text-genz-cyber-yellow" />
                  <h3 className="text-xl font-bold text-white mb-2">Sun Sign</h3>
                  <p className="text-2xl font-display font-bold bg-gradient-to-r from-genz-electric-blue to-genz-hot-pink bg-clip-text text-transparent">
                    {chartData.zodiac_sign}
                  </p>
                </GenZCard>

                <GenZCard variant="gradient" className="text-center">
                  <Moon className="w-12 h-12 mx-auto mb-4 text-genz-purple-haze" />
                  <h3 className="text-xl font-bold text-white mb-2">Moon Sign</h3>
                  <p className="text-2xl font-display font-bold bg-gradient-to-r from-genz-electric-blue to-genz-hot-pink bg-clip-text text-transparent">
                    {chartData.moon_sign}
                  </p>
                </GenZCard>

                <GenZCard variant="gradient" className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 text-genz-mint-fresh" />
                  <h3 className="text-xl font-bold text-white mb-2">Ascendant</h3>
                  <p className="text-2xl font-display font-bold bg-gradient-to-r from-genz-electric-blue to-genz-hot-pink bg-clip-text text-transparent">
                    {chartData.ascendant}
                  </p>
                </GenZCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'interpretation' && (
            <motion.div
              key="interpretation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <GenZCard variant="glass">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-cyber-yellow to-genz-sunset-orange flex items-center justify-center shadow-genz-glow flex-shrink-0">
                    <Sun className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white mb-3">Sun Sign Interpretation</h3>
                    <p className="text-white/80 leading-relaxed">{interpretations.sun}</p>
                  </div>
                </div>
              </GenZCard>

              <GenZCard variant="glass">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-purple-haze to-genz-lavender-dream flex items-center justify-center shadow-genz-glow flex-shrink-0">
                    <Moon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white mb-3">Moon Sign Interpretation</h3>
                    <p className="text-white/80 leading-relaxed">{interpretations.moon}</p>
                  </div>
                </div>
              </GenZCard>

              <GenZCard variant="glass">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-electric-blue to-genz-mint-fresh flex items-center justify-center shadow-genz-glow flex-shrink-0">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-display font-bold text-white mb-3">Ascendant Interpretation</h3>
                    <p className="text-white/80 leading-relaxed">{interpretations.ascendant}</p>
                  </div>
                </div>
              </GenZCard>

              <GenZCard variant="gradient">
                <div className="text-center">
                  <h3 className="text-2xl font-display font-bold text-white mb-4">Overall Chart Analysis</h3>
                  <p className="text-white/90 leading-relaxed text-lg">{interpretations.overall}</p>
                </div>
              </GenZCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomNav />
    </div>
  );
}
