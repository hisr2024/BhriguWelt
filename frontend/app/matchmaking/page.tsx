'use client';

import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Star, Zap } from 'lucide-react';
import Link from 'next/link';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';

export default function MatchmakingPage() {
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
          className="mb-12 text-center max-w-3xl mx-auto"
        >
          <motion.div
            className="text-8xl mb-6"
            animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💕
          </motion.div>
          <GenZBadge variant="neon" size="lg" className="mb-6" pulse>
            💫 Cosmic Matchmaking
          </GenZBadge>
          <h1 className="genz-title mb-6">
            Find Your Soul Connection
          </h1>
          <p className="text-xl text-white/80 leading-relaxed mb-8">
            Discover compatibility based on cosmic alignment and astrological synergy
          </p>

          <GenZCard variant="gradient" className="p-12">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze flex items-center justify-center shadow-genz-glow text-2xl">
                  ✨
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-white mb-1">Compatibility Score</h3>
                  <p className="text-white/70">Based on planetary positions</p>
                </div>
                <div className="text-4xl font-display font-bold text-genz-neon-green">
                  95%
                </div>
              </div>

              <div className="pt-6 border-t border-white/10">
                <h3 className="text-lg font-bold text-white mb-4">Top Matches</h3>
                <div className="space-y-3">
                  {['Aries', 'Leo', 'Sagittarius'].map((sign, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
                      <Star className="w-5 h-5 text-genz-cyber-yellow fill-genz-cyber-yellow" />
                      <span className="flex-1 text-white font-medium">{sign}</span>
                      <Zap className="w-4 h-4 text-genz-electric-blue" />
                    </div>
                  ))}
                </div>
              </div>

              <GenZButton variant="primary" size="lg" fullWidth className="mt-6">
                <Heart className="w-5 h-5 mr-2" />
                Explore Matches
              </GenZButton>
            </div>
          </GenZCard>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
