'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles, Moon, Sun, Star, Heart, Zap,
  BookOpen, Compass, TrendingUp, Shield,
  Users, Clock, Globe, Award, ChevronRight,
  CheckCircle, ArrowRight, Play, Quote
} from 'lucide-react';

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [email, setEmail] = useState('');
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.8]);

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
      description: 'Sarvam AI analyzes millions of astrological patterns'
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
    <div className="min-h-screen starry-bg">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-8 h-8 text-cosmic-purple animate-glow" />
              <span className="text-2xl font-bold bg-gradient-to-r from-cosmic-cyan to-cosmic-purple bg-clip-text text-transparent">
                BhriguWelt
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <Link
                href="/learn-more"
                className="hidden md:inline-block text-white/80 hover:text-white transition-colors"
              >
                Features
              </Link>
              <Link
                href="/learn-more"
                className="hidden md:inline-block text-white/80 hover:text-white transition-colors"
              >
                How It Works
              </Link>
              <Link href="/get-started" className="cosmic-button">
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-cosmic-purple/20 to-cosmic-pink/20 border border-cosmic-purple/30 rounded-full"
              >
                <span className="text-sm text-cosmic-cyan">✨ AI-Powered Vedic Astrology</span>
              </motion.div>

              <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-cosmic-cyan via-cosmic-purple to-cosmic-pink bg-clip-text text-transparent">
                  Unlock Your
                </span>
                <br />
                <span className="text-white">Soul's Journey</span>
              </h1>

              <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl">
                Ancient Vedic wisdom meets cutting-edge AI to reveal your past, present, and future lives with unprecedented accuracy
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/get-started" className="cosmic-button text-lg px-8 py-4 flex items-center justify-center gap-2 group">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="border-2 border-white/30 hover:border-white/50 hover:bg-white/5 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center gap-2">
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-white/70">
                {['✓ 100% Free to Start', '✓ No Credit Card', '✓ Instant Results'].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cosmic-cyan" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
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
      <section className="py-12 px-4 bg-black/40 backdrop-blur-lg border-y border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="flex justify-center mb-3 text-cosmic-cyan">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cosmic-cyan to-cosmic-purple bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </div>
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
                whileHover={{ scale: 1.05, y: -5 }}
                className="feature-card relative overflow-hidden"
              >
                <Link href={feature.link}>
                  {feature.badge && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-cosmic-pink to-cosmic-purple text-xs px-3 py-1 rounded-full font-semibold">
                      {feature.badge}
                    </div>
                  )}
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-white/70 mb-4">
                    {feature.description}
                  </p>
                  <div className="flex items-center text-cosmic-cyan text-sm font-semibold">
                    Explore <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-20 px-4 bg-gradient-to-b from-black/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="section-title mb-4">
              Powered by Advanced Technology
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Experience the perfect fusion of ancient wisdom and modern AI
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advancedFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className="cosmic-card hover:bg-white/10 transition-all duration-300 text-center"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-white/60 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-1/3 left-0 right-0 h-0.5 bg-gradient-to-r from-cosmic-cyan via-cosmic-purple to-cosmic-pink opacity-30"></div>

            {[
              {
                step: 1,
                title: 'Enter Birth Details',
                description: 'Provide your date, time, and place of birth for precise calculations',
                icon: <BookOpen className="w-6 h-6" />
              },
              {
                step: 2,
                title: 'AI Analysis',
                description: 'Our Sarvam AI analyzes your unique astrological chart with millions of data points',
                icon: <Zap className="w-6 h-6" />
              },
              {
                step: 3,
                title: 'Receive Insights',
                description: 'Get comprehensive predictions, guidance, and personalized remedies',
                icon: <Sparkles className="w-6 h-6" />
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="cosmic-card text-center relative z-10 hover:bg-white/10 transition-all duration-300"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cosmic-purple to-cosmic-pink flex items-center justify-center text-3xl font-bold mx-auto mb-4 shadow-2xl relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cosmic-cyan to-cosmic-pink opacity-0 hover:opacity-100 transition-opacity rounded-full"></div>
                  <span className="relative z-10">{item.step}</span>
                </div>
                <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/70">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-center mb-16"
          >
            <h2 className="section-title mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              See what our community says about their spiritual journey
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.15 }}
                className="cosmic-card hover:bg-white/10 transition-all duration-300"
              >
                <Quote className="w-8 h-8 text-cosmic-purple mb-4 opacity-50" />
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-cosmic-yellow text-cosmic-yellow" />
                  ))}
                </div>
                <p className="text-white/80 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-bold">{testimonial.name}</div>
                    <div className="text-sm text-white/60">{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="cosmic-card text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cosmic-purple/20 via-cosmic-pink/20 to-cosmic-cyan/20 blur-3xl"></div>
            <div className="relative z-10">
              <div className="text-6xl mb-6 animate-float">🌟</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Begin Your Soul's Journey Today
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Unlock the mysteries of your past, navigate your present, and illuminate your future with AI-powered Vedic wisdom
              </p>
              <Link href="/get-started" className="cosmic-button text-lg px-12 py-4 inline-flex items-center gap-2 group">
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <p className="text-sm text-white/60 mt-4">No credit card required • Instant access • 100% secure</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-6 h-6 text-cosmic-purple" />
                <span className="text-xl font-bold bg-gradient-to-r from-cosmic-cyan to-cosmic-purple bg-clip-text text-transparent">
                  BhriguWelt
                </span>
              </div>
              <p className="text-white/60 text-sm">
                Ancient wisdom for modern souls. Your journey to self-discovery starts here.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/karmic-journey" className="hover:text-white transition-colors">Karmic Journey</Link></li>
                <li><Link href="/past-lives" className="hover:text-white transition-colors">Past Lives</Link></li>
                <li><Link href="/future-lives" className="hover:text-white transition-colors">Future Lives</Link></li>
                <li><Link href="/predictions" className="hover:text-white transition-colors">Predictions</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/learn-more" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Stay Connected</h4>
              <p className="text-white/60 text-sm mb-3">Get cosmic insights in your inbox</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email"
                  className="cosmic-input flex-1 text-sm py-2 px-3"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="cosmic-button py-2 px-4 text-sm">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center text-white/60">
            <p className="mb-2">ॐ शान्तिः शान्तिः शान्तिः</p>
            <p className="text-sm">© 2025 BhriguWelt. Ancient wisdom for modern souls.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
