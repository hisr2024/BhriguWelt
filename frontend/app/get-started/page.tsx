'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Calendar, Clock, MapPin, ArrowRight, Shield, Zap } from 'lucide-react';
import { astrologyAPI, type BirthDetails } from '@/lib/api';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZButton from '../components/GenZButton';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import BottomNav from '../components/BottomNav';

export default function GetStartedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BirthDetails>({
    date_of_birth: '',
    time_of_birth: '',
    place_of_birth: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await astrologyAPI.calculateBirthChart(formData);

      // Store in localStorage for other pages
      if (typeof window !== 'undefined') {
        localStorage.setItem('birthDetails', JSON.stringify(formData));
        localStorage.setItem('birthChart', JSON.stringify(result.data));
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to calculate birth chart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    if (step === 1) return formData.date_of_birth !== '';
    if (step === 2) return formData.time_of_birth !== '';
    if (step === 3) return formData.place_of_birth !== '';
    return false;
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12 pb-24 md:pb-12">
      <AnimatedBackground />
      <FloatingElements />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl w-full relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            className="flex justify-center mb-6"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-genz-electric-blue/30 blur-3xl rounded-full"></div>
              <Sparkles className="w-20 h-20 text-genz-electric-blue relative z-10 animate-pulse-glow" />
            </div>
          </motion.div>

          <GenZBadge variant="neon" size="lg" className="mb-6" pulse>
            ✨ Step {step} of 3
          </GenZBadge>

          <motion.h1
            className="genz-title mb-6"
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {step === 1 && 'When Were You Born?'}
            {step === 2 && 'What Time?'}
            {step === 3 && 'Where Were You Born?'}
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-white/80 leading-relaxed"
            key={`desc-${step}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {step === 1 && 'Enter your birth date to start your cosmic journey'}
            {step === 2 && 'Time is crucial for accurate predictions'}
            {step === 3 && 'Location helps us calculate planetary positions'}
          </motion.p>
        </div>

        {/* Form */}
        <GenZCard variant="neon" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-genz-purple-haze/20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-genz-electric-blue/20 blur-3xl rounded-full"></div>

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {/* Progress Bar */}
            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                    s <= step
                      ? 'bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze shadow-genz-glow'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Date of Birth */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <label className="block text-lg font-display font-bold mb-4 flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-electric-blue to-genz-mint-fresh flex items-center justify-center shadow-genz-glow">
                    <Calendar className="w-6 h-6" />
                  </div>
                  Date of Birth
                </label>
                <input
                  type="date"
                  required
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="genz-input w-full text-lg"
                  autoFocus
                />
              </motion.div>
            )}

            {/* Step 2: Time of Birth */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <label className="block text-lg font-display font-bold mb-4 flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-purple-haze to-genz-lavender-dream flex items-center justify-center shadow-genz-glow">
                    <Clock className="w-6 h-6" />
                  </div>
                  Time of Birth
                </label>
                <input
                  type="time"
                  required
                  value={formData.time_of_birth}
                  onChange={(e) => setFormData({ ...formData, time_of_birth: e.target.value })}
                  className="genz-input w-full text-lg"
                  autoFocus
                />
                <p className="text-sm text-genz-mint-fresh mt-3 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Exact time gives more accurate predictions
                </p>
              </motion.div>
            )}

            {/* Step 3: Place of Birth */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <label className="block text-lg font-display font-bold mb-4 flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-hot-pink to-genz-coral-pop flex items-center justify-center shadow-genz-glow">
                    <MapPin className="w-6 h-6" />
                  </div>
                  Place of Birth
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., New Delhi, India"
                  value={formData.place_of_birth}
                  onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
                  className="genz-input w-full text-lg"
                  autoFocus
                />
                <p className="text-sm text-white/70 mt-3">
                  Enter city and country for accurate calculations
                </p>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-genz-hot-pink/20 border-2 border-genz-hot-pink/50 rounded-2xl p-4 text-white backdrop-blur-xl"
              >
                {error}
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 pt-6">
              {step > 1 && (
                <GenZButton
                  variant="outline"
                  size="lg"
                  onClick={() => setStep(step - 1)}
                  type="button"
                  className="flex-1"
                >
                  Back
                </GenZButton>
              )}

              {step < 3 ? (
                <GenZButton
                  variant="primary"
                  size="lg"
                  onClick={() => setStep(step + 1)}
                  disabled={!isStepValid()}
                  type="button"
                  className="flex-1 group"
                >
                  Continue
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </GenZButton>
              ) : (
                <GenZButton
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={loading || !isStepValid()}
                  loading={loading}
                  className="flex-1 shadow-genz-glow"
                  fullWidth
                >
                  {loading ? 'Calculating...' : 'Calculate My Chart ✨'}
                </GenZButton>
              )}
            </div>

            {/* Privacy Note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center gap-2 text-sm text-white/60 bg-white/5 rounded-full px-4 py-3 backdrop-blur-xl"
            >
              <Shield className="w-4 h-4 text-genz-neon-green" />
              Your data is encrypted and never shared
            </motion.div>
          </form>
        </GenZCard>

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="w-6 h-6" />,
              title: 'AI-Powered',
              description: 'Sarvam AI analysis',
              color: 'from-genz-electric-blue to-genz-mint-fresh',
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              title: 'Comprehensive',
              description: 'Past, present, future',
              color: 'from-genz-purple-haze to-genz-lavender-dream',
            },
            {
              icon: <Shield className="w-6 h-6" />,
              title: 'Personalized',
              description: 'Unique to you',
              color: 'from-genz-hot-pink to-genz-coral-pop',
            },
          ].map((feature, index) => (
            <GenZCard
              key={index}
              variant="glass"
              className="text-center group"
            >
              <motion.div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mx-auto mb-4 shadow-genz-glow group-hover:scale-110 transition-transform`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                {feature.icon}
              </motion.div>
              <h3 className="font-display font-bold text-white mb-2 text-lg group-hover:text-genz-electric-blue transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-white/70">{feature.description}</p>
            </GenZCard>
          ))}
        </div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
