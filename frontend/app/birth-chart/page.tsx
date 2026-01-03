'use client';

import { motion } from 'framer-motion';
import { Sparkles, Star, Moon, Sun, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';

export default function BirthChartPage() {
  const planets = [
    { name: 'Sun', sign: 'Aries', house: '1st', icon: <Sun className="w-6 h-6" />, color: 'from-genz-cyber-yellow to-genz-sunset-orange' },
    { name: 'Moon', sign: 'Taurus', house: '2nd', icon: <Moon className="w-6 h-6" />, color: 'from-genz-purple-haze to-genz-lavender-dream' },
    { name: 'Mercury', sign: 'Gemini', house: '3rd', icon: <Star className="w-6 h-6" />, color: 'from-genz-mint-fresh to-genz-electric-blue' },
    { name: 'Venus', sign: 'Libra', house: '7th', icon: <Sparkles className="w-6 h-6" />, color: 'from-genz-hot-pink to-genz-coral-pop' },
  ];

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

        {/* Chart Visualization */}
        <GenZCard variant="gradient" className="mb-12 text-center p-12">
          <motion.div
            className="w-64 h-64 mx-auto rounded-full bg-gradient-to-r from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink p-1 shadow-genz-glow"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-full h-full rounded-full bg-dark-base flex items-center justify-center">
              <div className="text-6xl">ॐ</div>
            </div>
          </motion.div>
          <p className="text-white/70 mt-6">Interactive chart visualization</p>
        </GenZCard>

        {/* Planetary Positions */}
        <h2 className="genz-heading mb-8 text-center">
          Planetary Positions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {planets.map((planet, index) => (
            <GenZCard key={index} variant="glass" className="group">
              <div className="flex items-center gap-4">
                <motion.div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${planet.color} flex items-center justify-center shadow-genz-glow`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  {planet.icon}
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-white mb-1 group-hover:text-genz-electric-blue transition-colors">
                    {planet.name}
                  </h3>
                  <p className="text-white/70">
                    {planet.sign} • {planet.house} House
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
