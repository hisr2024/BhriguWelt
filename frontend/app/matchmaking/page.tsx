'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';

export default function MatchmakingPage() {
  const [loading] = useState(false);

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
            Kundali Matching
          </h1>
          <p className="text-xl text-white/80 leading-relaxed mb-2">
            Traditional Ashtakoot (8-fold) Guna Milan system
          </p>
          <p className="text-sm text-white/60">
            Discover compatibility based on Vedic astrology principles
          </p>
        </motion.div>

        <GenZCard variant="gradient" className="p-12 text-center">
          <div className="space-y-6">
            <div className="text-7xl mb-4">🔮</div>
            <h2 className="text-3xl font-display font-bold text-white mb-4">
              Matchmaking Feature Coming Soon
            </h2>
            <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
              We're implementing a comprehensive Kundali matching system with:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <h3 className="font-bold text-white">Ashtakoot Analysis</h3>
                  <p className="text-sm text-white/70">8-fold compatibility scoring</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌟</span>
                <div>
                  <h3 className="font-bold text-white">Dosha Detection</h3>
                  <p className="text-sm text-white/70">Mangal Dosha and more</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💫</span>
                <div>
                  <h3 className="font-bold text-white">36-Point System</h3>
                  <p className="text-sm text-white/70">Traditional Guna Milan</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <h3 className="font-bold text-white">Remedies</h3>
                  <p className="text-sm text-white/70">Personalized solutions</p>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <GenZButton variant="primary" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5 mr-2" />
                    Start Matching (Coming Soon)
                  </>
                )}
              </GenZButton>
            </div>
          </div>
        </GenZCard>
      </div>

      <BottomNav />
    </div>
  );
}
