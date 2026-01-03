'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles, Moon, Sun, Star, Heart, Zap,
  BookOpen, Compass, TrendingUp, Shield
} from 'lucide-react';

export default function HomePage() {
  const [email, setEmail] = useState('');

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Karmic Journey',
      description: 'Discover your soul\'s purpose and life mission',
      link: '/karmic-journey',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      icon: <Moon className="w-8 h-8" />,
      title: 'Past Lives',
      description: 'Explore your previous incarnations and karmic patterns',
      link: '/past-lives',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Future Lives',
      description: 'Envision your soul\'s evolution and future paths',
      link: '/future-lives',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: <Sun className="w-8 h-8" />,
      title: 'Present Life',
      description: 'Comprehensive analysis of your current life path',
      link: '/present-life',
      color: 'from-lime-500 to-green-500'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Life Events',
      description: 'Predict important milestones and transitions',
      link: '/life-events',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Karmic Remedies',
      description: 'Personalized spiritual practices and remedies',
      link: '/karmic-remedies',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Relationships',
      description: 'Soul connections and compatibility analysis',
      link: '/relationships',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: <Compass className="w-8 h-8" />,
      title: 'Predictions',
      description: 'Daily, weekly, and monthly forecasts',
      link: '/predictions',
      color: 'from-teal-500 to-cyan-500'
    },
  ];

  return (
    <div className="min-h-screen starry-bg">
      {/* Header */}
      <nav className="border-b border-white/10 bg-black/20 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-8 h-8 text-cosmic-purple" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cosmic-cyan to-cosmic-purple bg-clip-text text-transparent">
                BhriguWelt
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <Link href="/get-started" className="cosmic-button">
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cosmic-cyan via-cosmic-purple to-cosmic-pink bg-clip-text text-transparent">
                Discover Your
              </span>
              <br />
              <span className="text-white">Soul's Journey</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-3xl mx-auto">
              Ancient Vedic wisdom meets cutting-edge AI to reveal your past, present, and future lives
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/get-started" className="cosmic-button text-lg px-8 py-4">
                Start Your Journey
              </Link>
              <Link href="/learn-more" className="border border-white/30 hover:border-white/50 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200">
                Learn More
              </Link>
            </div>
          </motion.div>

          {/* Floating OM Symbol */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-16 flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-cosmic-purple/20 blur-3xl rounded-full"></div>
              <div className="relative text-9xl animate-float">
                ॐ
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="section-title mb-4">
              Explore Your Cosmic Blueprint
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Comprehensive astrological insights powered by Sarvam AI and ancient Vedic knowledge
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="feature-card"
              >
                <Link href={feature.link}>
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-white/70">
                    {feature.description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="section-title mb-4">
              How It Works
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Three simple steps to unlock your cosmic insights
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: 1, title: 'Enter Birth Details', description: 'Provide your date, time, and place of birth' },
              { step: 2, title: 'AI Analysis', description: 'Our Sarvam AI analyzes your unique astrological chart' },
              { step: 3, title: 'Receive Insights', description: 'Get comprehensive predictions and guidance' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="cosmic-card text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cosmic-purple to-cosmic-pink flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-white/70">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto cosmic-card text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Begin Your Soul's Journey Today
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Unlock the mysteries of your past, navigate your present, and illuminate your future
            </p>
            <Link href="/get-started" className="cosmic-button text-lg px-12 py-4 inline-block">
              Get Started Free
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4 bg-black/40">
        <div className="max-w-7xl mx-auto text-center text-white/60">
          <p className="mb-2">ॐ शान्तिः शान्तिः शान्तिः</p>
          <p>© 2025 BhriguWelt. Ancient wisdom for modern souls.</p>
        </div>
      </footer>
    </div>
  );
}
