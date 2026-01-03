'use client';

import { motion } from 'framer-motion';
import { Sun, Star, Heart, Briefcase, Zap, ArrowLeft, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge, { StatusBadge } from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';

export default function DailyInsightsPage() {
  const insights = [
    {
      category: 'Love',
      icon: <Heart className="w-6 h-6" />,
      color: 'from-genz-hot-pink to-genz-coral-pop',
      rating: 4,
      message: 'Great day for romantic connections! Express your feelings openly.',
    },
    {
      category: 'Career',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'from-genz-electric-blue to-genz-mint-fresh',
      rating: 5,
      message: 'Professional opportunities abound. Take initiative on new projects.',
    },
    {
      category: 'Health',
      icon: <Zap className="w-6 h-6" />,
      color: 'from-genz-neon-green to-genz-lime-zest',
      rating: 3,
      message: 'Energy levels moderate. Prioritize rest and self-care today.',
    },
    {
      category: 'Finance',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-genz-cyber-yellow to-genz-sunset-orange',
      rating: 4,
      message: 'Good time for investments. Review your financial goals carefully.',
    },
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
          <GenZBadge variant="neon" size="lg" className="mb-6" pulse>
            ☀️ Daily Insights
          </GenZBadge>
          <h1 className="genz-title mb-4">
            Today's Forecast
          </h1>
          <p className="text-xl text-white/80">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Overall Energy */}
        <GenZCard variant="gradient" className="mb-12 text-center p-8">
          <div className="text-7xl mb-4">⭐</div>
          <h2 className="text-3xl font-display font-bold text-white mb-4">
            Overall Energy: High
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Today brings powerful cosmic energy for manifestation and growth. Align your intentions with the universe!
          </p>
          <div className="flex justify-center gap-2 mt-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-genz-cyber-yellow text-genz-cyber-yellow" />
            ))}
          </div>
        </GenZCard>

        {/* Category Insights */}
        <h2 className="genz-heading mb-8 text-center">
          Category Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insights.map((insight, index) => (
            <GenZCard key={index} variant="glass" className="group">
              <div className="flex items-start gap-4 mb-4">
                <motion.div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${insight.color} flex items-center justify-center shadow-genz-glow flex-shrink-0`}
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                >
                  {insight.icon}
                </motion.div>
                <div className="flex-1">
                  <h3 className="text-xl font-display font-bold text-white mb-2 group-hover:text-genz-electric-blue transition-colors">
                    {insight.category}
                  </h3>
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < insight.rating
                            ? 'fill-genz-cyber-yellow text-genz-cyber-yellow'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-white/80 leading-relaxed">
                {insight.message}
              </p>
            </GenZCard>
          ))}
        </div>

        {/* Lucky Elements */}
        <GenZCard variant="neon" className="mt-12">
          <h3 className="text-2xl font-display font-bold text-white mb-6 text-center">
            Today's Lucky Elements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-4xl mb-2">7</div>
              <p className="text-sm text-white/70">Lucky Number</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-genz-electric-blue mx-auto mb-2 shadow-genz-glow"></div>
              <p className="text-sm text-white/70">Lucky Color</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">💎</div>
              <p className="text-sm text-white/70">Sapphire</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🌅</div>
              <p className="text-sm text-white/70">11:11 AM</p>
            </div>
          </div>
        </GenZCard>
      </div>

      <BottomNav />
    </div>
  );
}
