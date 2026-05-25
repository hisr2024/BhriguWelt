'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles, TrendingUp, Heart, Calendar, Zap, Star,
  Moon, Sun, Award, Target, ArrowRight
} from 'lucide-react';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZButton from '../components/GenZButton';
import GenZBadge from '../components/GenZBadge';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [, setBirthDetails] = useState<any>(null);
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
      loadBirthDetails();
    }
  }, [encryptionKey]);

  const loadBirthDetails = async () => {
    if (!encryptionKey) return;
    try {
      const profile = await loadCurrentProfile(encryptionKey);
      if (profile) {
        setBirthDetails({
          date_of_birth: profile.dateOfBirth,
          time_of_birth: profile.timeOfBirth,
          place_of_birth: profile.placeOfBirth,
        });
      }
    } catch (error) {
      console.error('Error loading birth details:', error);
    }
  };

  if (encryptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const widgets = [
    { title: 'Cosmic Blueprint', description: 'Bhrigu Samhita & Nadi Jyotisa Predictions', icon: <Sparkles className="w-8 h-8" />, link: '/bhrigu-predictions', color: 'from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink', badge: 'Featured', featured: true },
    { title: 'Birth Chart', description: 'Explore your cosmic blueprint', icon: <Star className="w-8 h-8" />, link: '/birth-chart', color: 'from-genz-electric-blue to-genz-mint-fresh' },
    { title: 'AI Chat', description: 'Ask OpenAI about your journey', icon: <Zap className="w-8 h-8" />, link: '/ai-chat', color: 'from-genz-neon-green to-genz-lime-zest', badge: 'AI' },
    { title: 'Daily Insights', description: 'Your cosmic forecast for today', icon: <Sun className="w-8 h-8" />, link: '/daily-insights', color: 'from-genz-cyber-yellow to-genz-sunset-orange', badge: 'Today' },
    { title: 'Horoscope', description: 'Detailed predictions & guidance', icon: <Moon className="w-8 h-8" />, link: '/horoscope', color: 'from-genz-purple-haze to-genz-lavender-dream' },
    { title: 'Matchmaking', description: 'Find your cosmic connection', icon: <Heart className="w-8 h-8" />, link: '/matchmaking', color: 'from-genz-hot-pink to-genz-coral-pop' },
    { title: 'Life Events', description: 'Important milestones & dates', icon: <Calendar className="w-8 h-8" />, link: '/life-events', color: 'from-genz-electric-blue to-genz-purple-haze' },
  ];

  const stats = [
    { label: 'Charts Analyzed', value: '1', icon: <TrendingUp className="w-5 h-5" /> },
    { label: 'Insights Gained', value: '24', icon: <Zap className="w-5 h-5" /> },
    { label: 'Accuracy', value: '95%', icon: <Target className="w-5 h-5" /> },
    { label: 'Soul Rank', value: 'Rising', icon: <Award className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />
      <div className="genz-container py-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <GenZBadge variant="neon" className="mb-4">Dashboard</GenZBadge>
              <h1 className="genz-title mb-4">Welcome Back! ✨</h1>
              <p className="text-xl text-white/80">Your cosmic journey continues</p>
            </div>
            <GenZButton variant="outline" size="lg">
              <Link href="/profile" className="flex items-center gap-2">View Profile<ArrowRight className="w-5 h-5" /></Link>
            </GenZButton>
          </div>
        </motion.div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <GenZCard key={index} variant="glass" className="text-center">
              <div className="flex justify-center mb-3 text-genz-electric-blue">{stat.icon}</div>
              <div className="text-3xl font-display font-bold bg-gradient-to-r from-genz-electric-blue to-genz-hot-pink bg-clip-text text-transparent mb-1">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </GenZCard>
          ))}
        </div>
        {/* Featured Cosmic Blueprint */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <GenZCard variant="gradient" className="group relative overflow-hidden border-2 border-genz-electric-blue/50">
            <Link href="/bhrigu-predictions">
              <div className="absolute top-4 right-4 z-10">
                <GenZBadge variant="neon" size="lg" pulse>
                  ✨ Featured
                </GenZBadge>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-6 p-6">
                <motion.div
                  className="w-32 h-32 rounded-3xl bg-gradient-to-r from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink flex items-center justify-center shadow-genz-glow"
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Sparkles className="w-16 h-16" />
                </motion.div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl md:text-4xl font-display font-bold mb-4 text-white group-hover:text-genz-electric-blue transition-colors">
                    Cosmic Blueprint
                  </h3>
                  <p className="text-xl text-white/90 mb-4">
                    Explore comprehensive predictions from <span className="text-genz-neon-green font-bold">Bhrigu Samhita</span> and <span className="text-genz-lavender-dream font-bold">Nadi Jyotisa</span>
                  </p>
                  <p className="text-white/70 mb-6">
                    Discover your karmic journey, past lives, future paths, and personalized remedies powered by ancient Vedic wisdom
                  </p>
                  <div className="flex items-center justify-center md:justify-start text-genz-electric-blue font-bold text-lg">
                    Explore Now
                    <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          </GenZCard>
        </motion.div>

        {/* Other Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.filter(w => !w.featured).map((widget, index) => (
            <GenZCard key={index} variant="neon" className="group relative overflow-hidden">
              <Link href={widget.link}>
                {widget.badge && <div className="absolute top-4 right-4 z-10"><GenZBadge variant="default" size="sm">{widget.badge}</GenZBadge></div>}
                <motion.div className={`w-20 h-20 rounded-3xl bg-gradient-to-r ${widget.color} flex items-center justify-center mb-6 shadow-genz-glow`} whileHover={{ scale: 1.1 }} transition={{ duration: 0.5 }}>{widget.icon}</motion.div>
                <h3 className="text-2xl font-display font-bold mb-3 text-white group-hover:text-genz-electric-blue transition-colors">{widget.title}</h3>
                <p className="text-white/70 mb-6">{widget.description}</p>
                <div className="flex items-center text-genz-electric-blue font-bold">Explore<ArrowRight className="w-5 h-5 ml-2" /></div>
              </Link>
            </GenZCard>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
