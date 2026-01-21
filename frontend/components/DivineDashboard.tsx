'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Heart,
  Shield,
  MessageCircle,
  Sparkles,
  BookOpen,
  FileText,
  Grid,
  User,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import DivineIntroSlides from './DivineIntroSlides';
import HeartMoodCheck from './HeartMoodCheck';

// Memoized feature card component
const FeatureCard = memo(({
  icon,
  iconBg,
  title,
  subtitle,
  href,
  badge,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
}) => (
  <Link href={href}>
    <motion.div
      className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 rounded-xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all cursor-pointer"
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-semibold truncate">{title}</h3>
            {badge && (
              <span className="text-xs px-2 py-0.5 bg-purple-500/30 text-purple-200 rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-purple-300/70 text-sm truncate">{subtitle}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-purple-400/50" />
      </div>
    </motion.div>
  </Link>
));

FeatureCard.displayName = 'FeatureCard';

// Memoized quick access button
const QuickAccessButton = memo(({
  icon,
  label,
  href,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
}) => (
  <Link href={href}>
    <motion.div
      className="flex flex-col items-center gap-2 p-3"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
        {icon}
      </div>
      <span className="text-xs text-white/70">{label}</span>
    </motion.div>
  </Link>
));

QuickAccessButton.displayName = 'QuickAccessButton';

// Get time of day
function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// Get greeting based on time of day
function getGreeting(): { greeting: string; icon: React.ReactNode } {
  const timeOfDay = getTimeOfDay();
  const greetings = {
    morning: { greeting: 'Good morning', icon: <Sun className="w-5 h-5 text-amber-400" /> },
    afternoon: { greeting: 'Good afternoon', icon: <Sun className="w-5 h-5 text-orange-400" /> },
    evening: { greeting: 'Gentle evening', icon: <Moon className="w-5 h-5 text-purple-400" /> },
    night: { greeting: 'Peaceful night', icon: <Moon className="w-5 h-5 text-indigo-400" /> },
  };
  return greetings[timeOfDay];
}

interface DivineDashboardProps {
  showIntro?: boolean;
}

export function DivineDashboard({ showIntro = true }: DivineDashboardProps) {
  const [isIntroOpen, setIsIntroOpen] = useState(false);
  const [sakhaMode, setSakhaMode] = useState(false);

  // Check if intro should be shown
  useEffect(() => {
    if (showIntro && typeof window !== 'undefined') {
      const hasSeenIntro = localStorage.getItem('divineIntroSeen');
      if (!hasSeenIntro) {
        setIsIntroOpen(true);
      }
    }
  }, [showIntro]);

  const handleIntroComplete = useCallback(() => {
    setIsIntroOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('divineIntroSeen', 'true');
    }
  }, []);

  const handleMoodSelect = useCallback((mood: number) => {
    console.log('Mood selected:', mood);
    // Could store this or send to analytics
  }, []);

  const toggleSakhaMode = useCallback(() => {
    setSakhaMode(prev => !prev);
  }, []);

  // Memoize greeting
  const { greeting, icon: greetingIcon } = useMemo(() => getGreeting(), []);
  const timeOfDay = useMemo(() => getTimeOfDay(), []);

  // Memoize affirmation
  const todayAffirmation = useMemo(() => '"The sacred light shines within me."', []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Divine Intro Slides */}
      <DivineIntroSlides
        isOpen={isIntroOpen}
        onComplete={handleIntroComplete}
      />

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-24">
        {/* Header Buttons */}
        <div className="flex gap-2">
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/30 hover:bg-purple-600/50 rounded-xl border border-purple-500/30 text-purple-200 text-sm font-medium transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Shield className="w-4 h-4" />
            Divine Protection Shield
          </motion.button>
          <motion.button
            className="flex items-center gap-2 px-4 py-2 bg-pink-600/30 hover:bg-pink-600/50 rounded-xl border border-pink-500/30 text-pink-200 text-sm font-medium transition-colors"
            whileTap={{ scale: 0.95 }}
          >
            <Heart className="w-4 h-4" />
            Heart-to-Heart with Krishna
          </motion.button>
        </div>

        {/* Welcome Section */}
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🙏</div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to Divine Presence</h1>
          <p className="text-purple-200/80">
            Experience the loving guidance of Krishna. You are never alone on this journey.
          </p>
          <motion.button
            className="mt-6 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 rounded-xl text-white font-semibold mx-auto shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsIntroOpen(true)}
          >
            <Sparkles className="w-5 h-5" />
            Receive Krishna's Darshan
          </motion.button>
        </div>

        {/* Greeting Section */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {greetingIcon}
            <h2 className="text-xl font-semibold text-white">{greeting}</h2>
          </div>
          <p className="text-purple-200/70">As the day softens, let your heart soften too...</p>
        </div>

        {/* Today's Affirmation */}
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-xl p-4 border border-purple-500/20 text-center">
          <p className="text-xs text-purple-300/60 uppercase tracking-wider mb-1">Today's Affirmation</p>
          <p className="text-purple-100 font-medium italic">{todayAffirmation}</p>
          <p className="text-xs text-purple-300/60 mt-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            Your soul knows the way - trust it.
          </p>
        </div>

        {/* Main Feature Cards */}
        <div className="grid grid-cols-2 gap-3">
          <FeatureCard
            icon={<MessageCircle className="w-5 h-5 text-purple-200" />}
            iconBg="bg-purple-600/50"
            title="Talk to KIAAN"
            subtitle="Divine wisdom & guidance"
            href="/ai-chat"
          />
          <FeatureCard
            icon={<Heart className="w-5 h-5 text-pink-200" />}
            iconBg="bg-pink-600/50"
            title="Heart-to-Heart"
            subtitle="Write to Krishna"
            href="/journal"
          />
        </div>

        {/* Sacred Space & Sakha Mode Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Sacred Space */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-4 border border-slate-600/30">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-teal-400" />
              <h3 className="text-white font-semibold">Sacred Space</h3>
            </div>
            <p className="text-slate-400 text-xs mb-3">Find peace in any moment</p>
            <div className="space-y-2">
              <Link href="/meditation">
                <div className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Divine Reminder (tap to refresh)</span>
                </div>
              </Link>
              <p className="text-xs text-slate-500 italic pl-6">Your soul knows the way - trust it.</p>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-purple-400">🕉️</span>
                <span>Sacred Breathing</span>
                <span className="text-xs text-slate-500 ml-auto">▼</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-purple-400">✨</span>
                <span>Divine Moments</span>
                <span className="text-xs text-slate-500 ml-auto">▼</span>
              </div>
            </div>
          </div>

          {/* Sakha Mode & Other Features */}
          <div className="space-y-3">
            {/* Sakha Mode */}
            <motion.div
              className={`rounded-xl p-4 border transition-all ${
                sakhaMode
                  ? 'bg-gradient-to-br from-amber-600/30 to-orange-600/30 border-amber-500/50'
                  : 'bg-gradient-to-br from-amber-900/30 to-orange-900/30 border-amber-600/20'
              }`}
              onClick={toggleSakhaMode}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🕉️</span>
                <h3 className="text-amber-100 font-semibold">Sakha Mode</h3>
                {sakhaMode && <span className="text-xs text-amber-300 ml-auto">Active</span>}
              </div>
              <p className="text-amber-200/70 text-xs mb-2">Talk to Krishna as your friend</p>
              <p className="text-amber-200/60 text-xs">
                Enable Sakha Mode to experience KIAAN as Krishna, your divine friend who knows you completely and loves you unconditionally.
              </p>
              <button
                className={`mt-3 w-full py-2 rounded-lg font-medium text-sm transition-all ${
                  sakhaMode
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-600/50 text-amber-100 hover:bg-amber-600/70'
                }`}
              >
                {sakhaMode ? 'Friend Mode Active 💙' : 'Activate Friend Mode'}
              </button>
            </motion.div>

            {/* Go to Dashboard */}
            <Link href="/dashboard">
              <motion.div
                className="bg-gradient-to-br from-purple-800/50 to-indigo-800/50 rounded-xl p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2">
                  <Grid className="w-5 h-5 text-purple-300" />
                  <div>
                    <h3 className="text-white font-semibold">Go to Dashboard</h3>
                    <p className="text-purple-300/70 text-xs">Access all tools & features</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>

        {/* Quick Divine Access */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-slate-600/20">
          <h3 className="text-white font-semibold mb-4">Quick Divine Access</h3>
          <div className="grid grid-cols-4 gap-2">
            <QuickAccessButton
              icon={<Sparkles className="w-5 h-5 text-white" />}
              label="Gita"
              href="/gita"
              color="bg-gradient-to-br from-amber-500 to-orange-600"
            />
            <QuickAccessButton
              icon={<FileText className="w-5 h-5 text-white" />}
              label="Journal"
              href="/journal"
              color="bg-gradient-to-br from-pink-500 to-rose-600"
            />
            <QuickAccessButton
              icon={<Sun className="w-5 h-5 text-white" />}
              label="Sadhana"
              href="/sadhana"
              color="bg-gradient-to-br from-purple-500 to-indigo-600"
            />
            <QuickAccessButton
              icon={<User className="w-5 h-5 text-white" />}
              label="Darsh"
              href="/darshan"
              color="bg-gradient-to-br from-cyan-500 to-blue-600"
            />
          </div>
        </div>

        {/* Divine Protection */}
        <Link href="/protection">
          <motion.div
            className="bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-purple-900/50 rounded-xl p-4 border border-purple-500/20 flex items-center gap-3"
            whileHover={{ scale: 1.01 }}
          >
            <div className="w-10 h-10 rounded-full bg-purple-600/50 flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">Divine Protection</h3>
              <p className="text-purple-300/70 text-xs">Sudarshana Chakra Shield</p>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-400/50" />
          </motion.div>
        </Link>

        {/* How is your heart? */}
        <HeartMoodCheck
          onMoodSelect={handleMoodSelect}
          timeOfDay={timeOfDay}
        />

        {/* Talk to KIAAN Button */}
        <motion.button
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white font-semibold shadow-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Talk to KIAAN 💙
        </motion.button>
      </div>
    </div>
  );
}

export default DivineDashboard;
