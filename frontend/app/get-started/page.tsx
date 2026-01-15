'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Calendar, Clock, MapPin, ArrowRight, Shield, Zap, User } from 'lucide-react';
import { type BirthDetails } from '@/lib/api';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZButton from '../components/GenZButton';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import {
  createProfileWithRetry,
  type ProfileData,
  type ProfileCreationProgress,
} from '@/lib/services/profileCreationService';
import ProfileCreationProgress from '../components/ProfileCreationProgress';

export default function GetStartedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BirthDetails & { name: string }>({
    name: '',
    date_of_birth: '',
    time_of_birth: '',
    place_of_birth: '',
  });
  const [manualCoordsEnabled, setManualCoordsEnabled] = useState(false);
  const [manualCoords, setManualCoords] = useState({ latitude: '', longitude: '' });
  const [creationProgress, setCreationProgress] = useState<ProfileCreationProgress | null>(null);
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const today = new Date().toISOString().split('T')[0];

  const validateName = (value: string) => value.trim().length >= 2 && value.trim().length <= 80;
  const validateDate = (value: string) => {
    if (!value) return false;
    if (value > today) return false;
    return value >= '1900-01-01';
  };
  const validateTime = (value: string) => Boolean(value && value.length >= 4);
  const validatePlace = (value: string) => /[a-zA-Z]/.test(value) && value.trim().length >= 2;

  const validationErrors = {
    name: step === 1 && formData.name ? !validateName(formData.name) : false,
    date: step === 2 && formData.date_of_birth ? !validateDate(formData.date_of_birth) : false,
    time: step === 3 && formData.time_of_birth ? !validateTime(formData.time_of_birth) : false,
    place: step === 4 && formData.place_of_birth ? !validatePlace(formData.place_of_birth) : false,
  };

  useEffect(() => {
    if (!encryptionLoading && !isSetup) {
      router.push('/setup-passcode');
    }
  }, [encryptionLoading, isSetup, router]);

  useEffect(() => {
    if (!encryptionLoading && isSetup && !isUnlocked) {
      router.push('/unlock');
    }
  }, [encryptionLoading, isSetup, isUnlocked, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!encryptionKey) {
      setError('Please unlock the app first');
      return;
    }
    if (!validateName(formData.name) || !validateDate(formData.date_of_birth) || !validateTime(formData.time_of_birth) || !validatePlace(formData.place_of_birth)) {
      setError('Please enter valid birth details so we can calculate an accurate chart.');
      return;
    }
    const latitudeValue = manualCoords.latitude.trim() === '' ? undefined : Number(manualCoords.latitude);
    const longitudeValue = manualCoords.longitude.trim() === '' ? undefined : Number(manualCoords.longitude);
    if (manualCoordsEnabled && ((latitudeValue !== undefined && Number.isNaN(latitudeValue)) || (longitudeValue !== undefined && Number.isNaN(longitudeValue)))) {
      setError('Please enter valid numeric values for latitude and longitude.');
      return;
    }
    setLoading(true);
    setError('');
    setCreationProgress(null);

    try {
      // Build profile data
      const profileData: ProfileData = {
        name: formData.name,
        date_of_birth: formData.date_of_birth,
        time_of_birth: formData.time_of_birth,
        place_of_birth: formData.place_of_birth,
      };

      // Only add coordinates if both are present and are valid numbers
      if (
        latitudeValue !== undefined &&
        longitudeValue !== undefined &&
        !Number.isNaN(latitudeValue) &&
        !Number.isNaN(longitudeValue)
      ) {
        profileData.latitude = latitudeValue;
        profileData.longitude = longitudeValue;
      }

      // Create profile with progress tracking and retry logic
      const result = await createProfileWithRetry(
        profileData,
        {
          encryptionKey,
          onProgress: (progress) => {
            setCreationProgress(progress);
          },
        },
        2 // Max 2 retries
      );

      if (result.success) {
        // Navigate to dashboard on success
        router.push('/dashboard');
      } else {
        // Handle error with user-friendly message
        const errorMessage = result.error?.message || 'Failed to create profile. Please try again.';
        setError(errorMessage);
        setCreationProgress(null);
      }
    } catch (err: any) {
      // Fallback error handling
      const errorMessage = err.message || 'An unexpected error occurred. Please try again.';
      setError(errorMessage);
      setCreationProgress(null);
      console.error('Profile creation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (encryptionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const isStepValid = () => {
    if (step === 1) return validateName(formData.name);
    if (step === 2) return validateDate(formData.date_of_birth);
    if (step === 3) return validateTime(formData.time_of_birth);
    if (step === 4) return validatePlace(formData.place_of_birth);
    return false;
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-12 pb-24 md:pb-12">
      <AnimatedBackground />
      <FloatingElements />
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl w-full relative z-10">
        <div className="text-center mb-12">
          <motion.div className="flex justify-center mb-6" animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }} transition={{ duration: 3, repeat: Infinity }}>
            <div className="relative">
              <div className="absolute inset-0 bg-genz-electric-blue/30 blur-3xl rounded-full"></div>
              <Sparkles className="w-20 h-20 text-genz-electric-blue relative z-10 animate-pulse-glow" />
            </div>
          </motion.div>
          <GenZBadge variant="neon" size="lg" className="mb-6" pulse>Step {step} of 4</GenZBadge>
          <motion.h1 className="genz-title mb-6" key={step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {step === 1 && 'What\'s Your Name?'}
            {step === 2 && 'When Were You Born?'}
            {step === 3 && 'What Time?'}
            {step === 4 && 'Where Were You Born?'}
          </motion.h1>
          <motion.p className="text-xl md:text-2xl text-white/80 leading-relaxed" key={`desc-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {step === 1 && 'Tell us your name to personalize your journey'}
            {step === 2 && 'Enter your birth date to start your cosmic journey'}
            {step === 3 && 'Time is crucial for accurate predictions'}
            {step === 4 && 'Location helps us calculate planetary positions'}
          </motion.p>
        </div>
        <GenZCard variant="neon" className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-genz-purple-haze/20 blur-3xl rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-genz-electric-blue/20 blur-3xl rounded-full"></div>
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="flex gap-2 mb-8">
              {[1, 2, 3, 4].map((s) => (<div key={s} className={`h-2 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze shadow-genz-glow' : 'bg-white/10'}`} />))}
            </div>
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <label className="block text-lg font-display font-bold mb-4 flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-hot-pink to-genz-coral-pop flex items-center justify-center shadow-genz-glow"><User className="w-6 h-6" /></div>
                  Your Name
                </label>
                <input type="text" required placeholder="e.g., Arjun Kumar" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="genz-input w-full text-lg touch-manipulation" autoFocus />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <label className="block text-lg font-display font-bold mb-4 flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-electric-blue to-genz-mint-fresh flex items-center justify-center shadow-genz-glow"><Calendar className="w-6 h-6" /></div>
                  Date of Birth
                </label>
                <input type="date" required value={formData.date_of_birth} onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} className="genz-input w-full text-lg touch-manipulation" autoFocus />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <label className="block text-lg font-display font-bold mb-4 flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-purple-haze to-genz-lavender-dream flex items-center justify-center shadow-genz-glow"><Clock className="w-6 h-6" /></div>
                  Time of Birth
                </label>
                <input type="time" required value={formData.time_of_birth} onChange={(e) => setFormData({ ...formData, time_of_birth: e.target.value })} className="genz-input w-full text-lg touch-manipulation" autoFocus />
                <p className="text-sm text-genz-mint-fresh mt-3 flex items-center gap-2"><Zap className="w-4 h-4" />Exact time gives more accurate predictions</p>
              </motion.div>
            )}
            {step === 4 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <label className="block text-lg font-display font-bold mb-4 flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-genz-cyber-yellow to-genz-sunset-orange flex items-center justify-center shadow-genz-glow"><MapPin className="w-6 h-6" /></div>
                  Place of Birth
                </label>
                <input type="text" required placeholder="e.g., New Delhi, India" value={formData.place_of_birth} onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })} className="genz-input w-full text-lg touch-manipulation" autoFocus />
                <p className="text-sm text-white/70 mt-3">Enter city and country for accurate calculations</p>
                <div className="mt-6 space-y-4">
                  <label className="flex items-center gap-3 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={manualCoordsEnabled}
                      onChange={(e) => setManualCoordsEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-white/40 bg-white/10 text-genz-electric-blue focus:ring-genz-electric-blue"
                    />
                    Provide latitude/longitude manually (overrides geocoding)
                  </label>
                  {manualCoordsEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Latitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          placeholder="e.g., 28.6139"
                          value={manualCoords.latitude}
                          onChange={(e) => setManualCoords({ ...manualCoords, latitude: e.target.value })}
                          className="genz-input w-full touch-manipulation"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/70 mb-2">Longitude</label>
                        <input
                          type="number"
                          step="0.0001"
                          placeholder="e.g., 77.2090"
                          value={manualCoords.longitude}
                          onChange={(e) => setManualCoords({ ...manualCoords, longitude: e.target.value })}
                          className="genz-input w-full touch-manipulation"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
            {error && (<motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-genz-hot-pink/20 border-2 border-genz-hot-pink/50 rounded-2xl p-4 text-white backdrop-blur-xl">{error}</motion.div>)}
            {loading && creationProgress && (
              <ProfileCreationProgress progress={creationProgress} error={error} />
            )}
            <div className="flex gap-4 pt-6">
              {step > 1 && (<GenZButton variant="outline" size="lg" onClick={() => setStep(step - 1)} type="button" className="flex-1">Back</GenZButton>)}
              {step < 4 ? (
                <GenZButton variant="primary" size="lg" onClick={() => setStep(step + 1)} disabled={!isStepValid()} type="button" className="flex-1 group">Continue<ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" /></GenZButton>
              ) : (
                <GenZButton variant="primary" size="lg" type="submit" disabled={loading || !isStepValid()} loading={loading} className="flex-1 shadow-genz-glow" fullWidth>{loading ? 'Calculating...' : 'Calculate My Chart'}</GenZButton>
              )}
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-center gap-2 text-sm text-white/60 bg-white/5 rounded-full px-4 py-3 backdrop-blur-xl">
              <Shield className="w-4 h-4 text-genz-neon-green" />Your data is encrypted and never shared
            </motion.div>
          </form>
        </GenZCard>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{ icon: <Zap className="w-6 h-6" />, title: 'AI-Powered', description: 'OpenAI analysis', color: 'from-genz-electric-blue to-genz-mint-fresh' }, { icon: <Sparkles className="w-6 h-6" />, title: 'Comprehensive', description: 'Past, present, future', color: 'from-genz-purple-haze to-genz-lavender-dream' }, { icon: <Shield className="w-6 h-6" />, title: 'Personalized', description: 'Unique to you', color: 'from-genz-hot-pink to-genz-coral-pop' }].map((feature, index) => (
            <GenZCard key={index} variant="glass" className="text-center group">
              <motion.div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center mx-auto mb-4 shadow-genz-glow group-hover:scale-110 transition-transform`} whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>{feature.icon}</motion.div>
              <h3 className="font-display font-bold text-white mb-2 text-lg group-hover:text-genz-electric-blue transition-colors">{feature.title}</h3>
              <p className="text-sm text-white/70">{feature.description}</p>
            </GenZCard>
          ))}
        </div>
      </motion.div>
      <BottomNav />
    </div>
  );
}
