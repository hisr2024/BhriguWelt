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
import { useEncryptionKey } from '@/lib/hooks/useEncryptedStorage';
import { getItem, STORES } from '@/lib/storage';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [birthDetails, setBirthDetails] = useState<any>(null);
  const { encryptionKey, isSetup, isLoading: encryptionLoading } = useEncryptionKey();
  const router = useRouter();

  // Redirect to passcode setup if encryption not configured
  useEffect(() => {
    if (!encryptionLoading && !isSetup) {
      router.push('/setup-passcode');
    }
  }, [encryptionLoading, isSetup, router]);

  // Redirect to unlock if not unlocked
  useEffect(() => {
    if (!encryptionLoading && isSetup && !encryptionKey) {
      router.push('/unlock');
    }
  }, [encryptionLoading, isSetup, encryptionKey, router]);

  // Load birth details from encrypted IndexedDB
  useEffect(() => {
    if (encryptionKey) {
      loadBirthDetails();
    }
  }, [encryptionKey]);

  const loadBirthDetails = async () => {
    if (!encryptionKey) return;

    try {
      const profile = await getItem(STORES.PROFILES, 'current_profile', encryptionKey);
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

  // Show loading while checking encryption status
  if (encryptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const widgets = [
    {
      title: 'Birth Chart',
      description: 'Explore your cosmic blueprint',
      icon: <Sparkles className="w-8 h-8" />,
      link: '/birth-chart',
      color: 'from-genz-electric-blue to-genz-mint-fresh',
      badge: 'New',
    },
    {
      title: 'Daily Insights',
      description: 'Your cosmic forecast for today',
      icon: <Sun className="w-8 h-8" />,
      link: '/daily-insights',
      color: 'from-genz-cyber-yellow to-genz-sunset-orange',
      badge: 'Today',
    },
    {
      title: 'Horoscope',
      description: 'Detailed predictions & guidance',
      icon: <Moon className="w-8 h-8" />,
      link: '/horoscope',
      color: 'from-genz-purple-haze to-genz-lavender-dream',
    },
    {
      title: 'Matchmaking',
      description: 'Find your cosmic connection',
      icon: <Heart className="w-8 h-8" />,
      link: '/matchmaking',
      color: 'from-genz-hot-pink to-genz-coral-pop',
      badge: 'Hot',
    },
    {
      title: 'Lucky Elements',
      description: 'Numbers, colors & gemstones',
      icon: <Star className="w-8 h-8" />,
      link: '/lucky-elements',
      color: 'from-genz-neon-green to-genz-lime-zest',
    },
    {
      title: 'Life Events',
      description: 'Important milestones & dates',
      icon: <Calendar className="w-8 h-8" />,
      link: '/life-events',
      color: 'from-genz-electric-blue to-genz-purple-haze',
    },
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <GenZBadge variant="neon" className="mb-4">
                Dashboard
              </GenZBadge>
              <h1 className="genz-title mb-4">
                Welcome Back! ✨
              </h1>
              <p className="text-xl text-white/80">
                Your cosmic journey continues
              </p>
            </div>
            <GenZButton variant="outline" size="lg">
              <Link href="/profile" className="flex items-center gap-2">
                View Profile
                <ArrowRight className="w-5 h-5" />
              </Link>
            </GenZButton>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <GenZCard key={index} variant="glass" className="text-center">
              <div className="flex justify-center mb-3 text-genz-electric-blue">
                {stat.icon}
              </div>
              <div className="text-3xl font-display font-bold bg-gradient-to-r from-genz-electric-blue to-genz-hot-pink bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </GenZCard>
          ))}
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {widgets.map((widget, index) => (
            <GenZCard
              key={index}
              variant="neon"
              className="group relative overflow-hidden"
            >
              <Link href={widget.link}>
                {widget.badge && (
                  <div className="absolute top-4 right-4 z-10">
                    <GenZBadge variant="default" size="sm">
                      {widget.badge}
                    </GenZBadge>
                  </div>
                )}

                <motion.div
                  className={`w-20 h-20 rounded-3xl bg-gradient-to-r ${widget.color} flex items-center justify-center mb-6 shadow-genz-glow`}
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {widget.icon}
                </motion.div>

                <h3 className="text-2xl font-display font-bold mb-3 text-white group-hover:text-genz-electric-blue transition-colors">
                  {widget.title}
                </h3>

                <p className="text-white/70 mb-6">
                  {widget.description}
                </p>

                <div className="flex items-center text-genz-electric-blue font-bold group-hover:gap-3 transition-all">
                  Explore
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            </GenZCard>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
