'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Award, ArrowRight, BookOpen, CheckCircle, ChevronRight, Clock, Compass, Globe, Heart, Menu, Moon, Play, Quote, Shield, Sparkles, Star, Sun, TrendingUp, Users, X, Zap } from 'lucide-react';
import GenZButton from './GenZButton';
import GenZCard, { GenZCardGradient } from './GenZCard';
import GenZBadge, { StatusBadge } from './GenZBadge';
import BottomNav from './BottomNav';

const AnimatedBackground = dynamic(() => import('./AnimatedBackground'), { ssr: false });
const FloatingElements = dynamic(
  () => import('./AnimatedBackground').then((mod) => mod.FloatingElements),
  { ssr: false }
);
const OnboardingTutorial = dynamic(() => import('../../components/OnboardingTutorial'), { ssr: false });

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [email, setEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

  // Check if tutorial has been completed on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tutorialCompleted = localStorage.getItem('tutorialCompleted');
      if (!tutorialCompleted) {
        setShowTutorial(true);
      }
    }
  }, []);

  const features = [
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: 'Karmic Journey',
      description: 'Discover your soul\'s purpose and life mission through detailed karmic analysis',
      link: '/karmic-journey',
      color: 'from-cyan-500 to-blue-500',
      badge: 'Popular'
    },
    {
      icon: <Moon className="w-8 h-8" />,
      title: 'Past Lives',
      description: 'Explore your previous incarnations and karmic patterns across lifetimes',
      link: '/past-lives',
      color: 'from-purple-500 to-pink-500',
      badge: 'New'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Future Lives',
      description: 'Envision your soul\'s evolution and future paths with AI-powered predictions',
      link: '/future-lives',
      color: 'from-yellow-500 to-orange-500',
      badge: 'AI Powered'
    },
    {
      icon: <Sun className="w-8 h-8" />,
      title: 'Present Life',
      description: 'Comprehensive analysis of your current life path and opportunities',
      link: '/present-life',
      color: 'from-lime-500 to-green-500'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Life Events',
      description: 'Predict important milestones and transitions with precision timing',
      link: '/life-events',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Karmic Remedies',
      description: 'Personalized spiritual practices and remedies for balance',
      link: '/karmic-remedies',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'Relationships',
      description: 'Soul connections and compatibility analysis for deeper bonds',
      link: '/relationships',
      color: 'from-red-500 to-pink-500'
    },
    {
      icon: <Compass className="w-8 h-8" />,
      title: 'Predictions',
      description: 'Daily, weekly, and monthly forecasts with actionable insights',
      link: '/predictions',
      color: 'from-teal-500 to-cyan-500'
    },
  ];

  const stats = [
    { value: '100K+', label: 'Soul Journeys', icon: <Users className="w-6 h-6" /> },
    { value: '95%', label: 'Accuracy Rate', icon: <Award className="w-6 h-6" /> },
    { value: '24/7', label: 'AI Support', icon: <Clock className="w-6 h-6" /> },
    { value: '50+', label: 'Countries', icon: <Globe className="w-6 h-6" /> },
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Spiritual Seeker',
      content: 'BhriguWelt revealed patterns in my life I never understood. The past life reading was transformative.',
      rating: 5,
      avatar: '🙏'
    },
    {
      name: 'Arjun Patel',
      role: 'Entrepreneur',
      content: 'The future predictions helped me make critical business decisions. Incredibly accurate and insightful.',
      rating: 5,
      avatar: '🌟'
    },
    {
      name: 'Maya Krishnan',
      role: 'Yoga Teacher',
      content: 'The karmic remedies brought peace to my life. This is authentic Vedic wisdom enhanced by AI.',
      rating: 5,
      avatar: '✨'
    },
  ];

  const advancedFeatures = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'AI-Powered Insights',
      description: 'OpenAI analyzes millions of astrological patterns'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Vedic Knowledge',
      description: '5000+ years of ancient wisdom at your fingertips'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Privacy First',
      description: 'Your spiritual journey is completely confidential'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Real-Time Updates',
      description: 'Daily insights based on planetary transits'
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      <FloatingElements />

      {/* Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-dark-elevated/50 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <motion.div
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ duration: 0.6 }}
              >
                <Sparkles className="w-8 h-8 text-genz-electric-blue animate-pulse-glow" />
              </motion.div>
              <span className="text-2xl md:text-3xl font-display font-extrabold bg-gradient-to-r from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink bg-clip-text text-transparent">
                BhriguWelt
              </span>
              <GenZBadge variant="neon" size="sm" className="hidden sm:inline-flex">
                AI
              </GenZBadge>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center space-x-6"
            >
              <Link
                href="#features"
                className="text-white/80 hover:text-genz-electric-blue transition-colors font-medium"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-white/80 hover:text-genz-electric-blue transition-colors font-medium"
              >
                How It Works
              </Link>
              <Link
                href="#testimonials"
                className="text-white/80 hover:text-genz-electric-blue transition-colors font-medium"
              >
                Reviews
              </Link>
              <GenZButton variant="primary" size="md">
                <Link href="/get-started">Get Started</Link>
              </GenZButton>
            </motion.div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-white/10"
            >
              <div className="flex flex-col space-y-4">
                <Link
                  href="#features"
                  className="text-white/80 hover:text-genz-electric-blue transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-white/80 hover:text-genz-electric-blue transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  href="#testimonials"
                  className="text-white/80 hover:text-genz-electric-blue transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Reviews
                </Link>
                <GenZButton variant="primary" size="md" fullWidth>
                  <Link href="/get-started">Get Started</Link>
                </GenZButton>
              </div>
            </motion.div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="genz-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="relative z-10"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-block mb-6"
              >
                <GenZBadge variant="neon" size="lg" icon="✨" pulse>
                  AI-Powered Vedic Astrology
                </GenZBadge>
              </motion.div>

              <motion.h1
                className="genz-title mb-6 animate-gradient"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Unlock Your
                <br />
                <span className="text-white drop-shadow-[0_0_30px_rgba(0,217,255,0.5)]">
                  Soul's Journey ✨
                </span>
              </motion.h1>

              <motion.p
                className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Ancient Vedic wisdom meets{' '}
                <span className="text-genz-electric-blue font-bold">cutting-edge AI</span> to
                reveal your past, present, and future lives with{' '}
                <span className="text-genz-hot-pink font-bold">unprecedented accuracy</span>
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <GenZButton variant="primary" size="lg" className="group">
                  <Link href="/get-started" className="flex items-center gap-2">
                    Start Your Journey
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </GenZButton>
                <GenZButton variant="outline" size="lg" className="group">
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </GenZButton>
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {[
                  { icon: '🎁', text: '100% Free to Start' },
                  { icon: '💳', text: 'No Credit Card' },
                  { icon: '⚡', text: 'Instant Results' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center gap-2 bg-white/5 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10"
                    whileHover={{ scale: 1.05, borderColor: 'rgba(0, 217, 255, 0.5)' }}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-white/90 font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Floating OM Symbol - KEPT FROM OLD DESIGN */}
            <motion.div
              style={{ opacity, scale }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-cosmic-purple/30 via-cosmic-pink/30 to-cosmic-cyan/30 blur-3xl rounded-full"
                ></motion.div>

                <div className="relative">
                  <div className="absolute inset-0 bg-cosmic-purple/20 blur-3xl rounded-full"></div>
                  <div className="relative text-9xl md:text-[12rem] animate-float filter drop-shadow-2xl">
                    ॐ
                  </div>
                </div>

                {/* Orbiting elements */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="absolute top-0 left-1/2 w-4 h-4 bg-cosmic-cyan rounded-full blur-sm"></div>
                </motion.div>
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <div className="absolute bottom-0 right-1/2 w-3 h-3 bg-cosmic-pink rounded-full blur-sm"></div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-dark-elevated/30 backdrop-blur-2xl border-y border-genz-electric-blue/20">
        <div className="genz-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
                whileHover={{ scale: 1.05 }}
                className="text-center group cursor-pointer"
              >
                <motion.div
                  className="flex justify-center mb-4 text-genz-electric-blue group-hover:text-genz-hot-pink transition-colors"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {stat.icon}
                </motion.div>
                <div className="text-4xl md:text-5xl font-display font-extrabold bg-gradient-to-r from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">
                  {stat.value}
                </div>
                <div className="text-white/80 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="genz-section px-4">
        <div className="genz-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-block mb-4"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <GenZBadge variant="outline" size="lg">
                🎯 Features
              </GenZBadge>
            </motion.div>
            <h2 className="genz-heading mb-6">
              Explore Your Cosmic Blueprint
            </h2>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Comprehensive astrological insights powered by{' '}
              <span className="text-genz-neon-green font-bold">OpenAI</span> and ancient Vedic knowledge
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <GenZCard
                key={index}
                variant="glass"
                className="group relative overflow-hidden"
                hoverEffect={true}
              >
                <Link href={feature.link}>
                  {feature.badge && (
                    <div className="absolute top-4 right-4 z-10">
                      <GenZBadge variant="default" size="sm">
                        {feature.badge}
                      </GenZBadge>
                    </div>
                  )}

                  <motion.div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-6 shadow-genz-glow`}
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    {feature.icon}
                  </motion.div>

                  <h3 className="text-xl font-display font-bold mb-3 text-white group-hover:text-genz-electric-blue transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-white/70 mb-6 line-clamp-3">
                    {feature.description}
                  </p>

                  <div className="flex items-center text-genz-electric-blue font-bold group-hover:gap-3 transition-all">
                    Explore
                    <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              </GenZCard>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="genz-section px-4 bg-gradient-to-b from-dark-elevated/20 to-transparent">
        <div className="genz-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-block mb-4"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <GenZBadge variant="default" size="lg">
                🚀 Technology
              </GenZBadge>
            </motion.div>
            <h2 className="genz-heading mb-6">
              Powered by Advanced Technology
            </h2>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Experience the perfect fusion of{' '}
              <span className="text-genz-lavender-dream font-bold">ancient wisdom</span> and{' '}
              <span className="text-genz-electric-blue font-bold">modern AI</span>
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advancedFeatures.map((feature, index) => (
              <GenZCard
                key={index}
                variant="glass"
                className="text-center group"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-genz-purple-haze to-genz-hot-pink flex items-center justify-center mx-auto mb-6 shadow-genz-glow group-hover:scale-110 transition-transform"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-lg font-display font-bold mb-3 text-white group-hover:text-genz-electric-blue transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
              </GenZCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="genz-section px-4">
        <div className="genz-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <motion.div
              className="inline-block mb-4"
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <GenZBadge variant="neon" size="lg">
                ⚡ How It Works
              </GenZBadge>
            </motion.div>
            <h2 className="genz-heading mb-6">
              Three Simple Steps
            </h2>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              Start your cosmic journey in minutes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-1/3 left-0 right-0 h-1 bg-gradient-to-r from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink opacity-20 rounded-full"></div>

            {[
              {
                step: 1,
                emoji: '📝',
                title: 'Enter Birth Details',
                description: 'Provide your date, time, and place of birth for precise calculations',
                icon: <BookOpen className="w-6 h-6" />,
                color: 'from-genz-electric-blue to-genz-mint-fresh',
              },
              {
                step: 2,
                emoji: '🤖',
                title: 'AI Analysis',
                description: 'Our OpenAI analyzes your unique astrological chart with millions of data points',
                icon: <Zap className="w-6 h-6" />,
                color: 'from-genz-purple-haze to-genz-lavender-dream',
              },
              {
                step: 3,
                emoji: '✨',
                title: 'Receive Insights',
                description: 'Get comprehensive predictions, guidance, and personalized remedies',
                icon: <Sparkles className="w-6 h-6" />,
                color: 'from-genz-hot-pink to-genz-coral-pop',
              },
            ].map((item, index) => (
              <GenZCard
                key={index}
                variant="neon"
                className="text-center relative z-10 group"
              >
                <motion.div
                  className={`w-24 h-24 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-4xl font-display font-black mx-auto mb-6 shadow-genz-glow relative`}
                  whileHover={{ scale: 1.1, rotate: [0, -5, 5, -5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="absolute text-6xl opacity-20">{item.emoji}</span>
                  <span className="relative z-10 text-white">{item.step}</span>
                </motion.div>

                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>

                <h3 className="text-2xl font-display font-bold mb-4 text-white group-hover:text-genz-electric-blue transition-colors">
                  {item.title}
                </h3>
                <p className="text-white/80 leading-relaxed">{item.description}</p>
              </GenZCard>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="genz-section px-4 bg-dark-surface/30">
        <div className="genz-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.div
              className="inline-block mb-4"
              whileInView={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
            >
              <GenZBadge variant="outline" size="lg">
                💬 Reviews
              </GenZBadge>
            </motion.div>
            <h2 className="genz-heading mb-6">
              Trusted by Thousands
            </h2>
            <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              See what our community says about their{' '}
              <span className="text-genz-purple-haze font-bold">spiritual journey</span>
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <GenZCard
                key={index}
                variant="gradient"
                className="relative group"
              >
                <div className="absolute top-6 right-6 text-6xl opacity-10">
                  {testimonial.avatar}
                </div>

                <Quote className="w-10 h-10 text-genz-electric-blue mb-6 opacity-60 group-hover:opacity-100 transition-opacity" />

                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Star className="w-5 h-5 fill-genz-cyber-yellow text-genz-cyber-yellow" />
                    </motion.div>
                  ))}
                </div>

                <p className="text-white/90 mb-8 text-lg italic leading-relaxed relative z-10">
                  "{testimonial.content}"
                </p>

                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-genz-electric-blue to-genz-purple-haze flex items-center justify-center text-2xl shadow-genz-glow">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-white">{testimonial.name}</div>
                    <div className="text-sm text-genz-electric-blue font-medium">{testimonial.role}</div>
                  </div>
                </div>
              </GenZCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="genz-section px-4">
        <div className="max-w-5xl mx-auto">
          <GenZCardGradient className="text-center relative overflow-hidden p-12 md:p-16">
            <div className="absolute inset-0 bg-mesh-gradient opacity-50"></div>
            <div className="absolute inset-0 animate-pulse-glow"></div>

            <div className="relative z-10">
              <motion.div
                className="text-7xl md:text-8xl mb-8"
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                🌟
              </motion.div>

              <motion.h2
                className="text-4xl md:text-6xl font-display font-extrabold mb-6 bg-gradient-to-r from-genz-electric-blue via-white to-genz-hot-pink bg-clip-text text-transparent leading-tight"
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                transition={{ type: 'spring' }}
              >
                Begin Your Soul's
                <br />
                Journey Today
              </motion.h2>

              <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
                Unlock the mysteries of your past, navigate your present, and illuminate your future with{' '}
                <span className="text-genz-neon-green font-bold">AI-powered</span> Vedic wisdom
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <GenZButton variant="primary" size="lg" className="group shadow-genz-glow">
                  <Link href="/get-started" className="flex items-center gap-2">
                    Get Started Free
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                  </Link>
                </GenZButton>
                <GenZButton variant="outline" size="lg">
                  Learn More
                </GenZButton>
              </div>

              <div className="flex flex-wrap gap-4 justify-center text-sm text-white/80">
                {['No credit card required', 'Instant access', '100% secure'].map((text, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-xl">
                    <CheckCircle className="w-4 h-4 text-genz-neon-green" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </GenZCardGradient>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-genz-electric-blue/20 py-16 px-4 bg-dark-surface/50 backdrop-blur-2xl mt-20">
        <div className="genz-container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                  <Sparkles className="w-7 h-7 text-genz-electric-blue" />
                </motion.div>
                <span className="text-2xl font-display font-extrabold bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze bg-clip-text text-transparent">
                  BhriguWelt
                </span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                Ancient wisdom for modern souls. Your journey to self-discovery starts here.
              </p>
              <GenZBadge variant="neon" size="sm">
                AI-Powered
              </GenZBadge>
            </div>

            <div>
              <h4 className="font-display font-bold mb-6 text-lg text-white">Features</h4>
              <ul className="space-y-3 text-white/70 text-sm">
                <li>
                  <Link href="/birth-chart" className="hover:text-genz-electric-blue transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Birth Chart
                  </Link>
                </li>
                <li>
                  <Link href="/horoscope" className="hover:text-genz-electric-blue transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Horoscope
                  </Link>
                </li>
                <li>
                  <Link href="/daily-insights" className="hover:text-genz-electric-blue transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Daily Insights
                  </Link>
                </li>
                <li>
                  <Link href="/matchmaking" className="hover:text-genz-electric-blue transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Matchmaking
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold mb-6 text-lg text-white">Company</h4>
              <ul className="space-y-3 text-white/70 text-sm">
                <li>
                  <Link href="/about" className="hover:text-genz-electric-blue transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#how-it-works" className="hover:text-genz-electric-blue transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-genz-electric-blue transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-genz-electric-blue transition-colors flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Terms
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-bold mb-6 text-lg text-white">Stay Connected</h4>
              <p className="text-white/70 text-sm mb-4 leading-relaxed">
                Get cosmic insights in your inbox
              </p>
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Your email"
                  className="genz-input-glass text-sm py-3 px-4"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <GenZButton variant="pill" size="sm" fullWidth>
                  Join Now
                </GenZButton>
              </div>
            </div>
          </div>

          <div className="border-t border-genz-electric-blue/20 pt-8">
            <div className="text-center">
              <motion.p
                className="text-4xl mb-4"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ॐ
              </motion.p>
              <p className="text-white/80 mb-3 text-lg font-serif">शान्तिः शान्तिः शान्तिः</p>
              <p className="text-sm text-white/60">
                © 2025 BhriguWelt.{' '}
                <span className="text-genz-electric-blue">Ancient wisdom for modern souls.</span>
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Onboarding Tutorial */}
      {showTutorial && (
        <OnboardingTutorial
          onComplete={() => {
            if (typeof window !== 'undefined') {
              localStorage.setItem('tutorialCompleted', 'true');
            }
            setShowTutorial(false);
          }}
        />
      )}
    </div>
  );
}
