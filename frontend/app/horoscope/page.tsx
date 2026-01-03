'use client';

import { motion } from 'framer-motion';
import { Star, ArrowLeft, Moon, Sun, Zap } from 'lucide-react';
import Link from 'next/link';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';

export default function HoroscopePage() {
  const predictions = [
    { period: 'Today', icon: <Sun className="w-6 h-6" />, color: 'from-genz-cyber-yellow to-genz-sunset-orange', text: 'A day of new beginnings and opportunities!' },
    { period: 'This Week', icon: <Moon className="w-6 h-6" />, color: 'from-genz-purple-haze to-genz-lavender-dream', text: 'Focus on personal growth and relationships.' },
    { period: 'This Month', icon: <Star className="w-6 h-6" />, color: 'from-genz-electric-blue to-genz-mint-fresh', text: 'Career advancement and financial gains ahead.' },
    { period: 'This Year', icon: <Zap className="w-6 h-6" />, color: 'from-genz-hot-pink to-genz-coral-pop', text: 'Major life transformations and soul evolution.' },
  ];

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
          className="mb-12 text-center"
        >
          <GenZBadge variant="neon" size="lg" className="mb-6">
            🌙 Horoscope
          </GenZBadge>
          <h1 className="genz-title mb-4">
            Your Predictions
          </h1>
          <p className="text-xl text-white/80">
            Cosmic guidance for your journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {predictions.map((pred, index) => (
            <GenZCard key={index} variant="glass" className="group">
              <div className="flex items-start gap-4">
                <motion.div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${pred.color} flex items-center justify-center shadow-genz-glow flex-shrink-0`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  {pred.icon}
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-white mb-3 group-hover:text-genz-electric-blue transition-colors">
                    {pred.period}
                  </h3>
                  <p className="text-white/80 leading-relaxed">
                    {pred.text}
                  </p>
                </div>
              </div>
            </GenZCard>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
