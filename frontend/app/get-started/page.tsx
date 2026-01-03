'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Calendar, Clock, MapPin } from 'lucide-react';
import { astrologyAPI, type BirthDetails } from '@/lib/api';

export default function GetStartedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  return (
    <div className="min-h-screen starry-bg flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Sparkles className="w-16 h-16 text-cosmic-purple animate-glow" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cosmic-cyan to-cosmic-purple bg-clip-text text-transparent">
              Begin Your Journey
            </span>
          </h1>
          <p className="text-xl text-white/70">
            Enter your birth details to unlock your cosmic blueprint
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="cosmic-card space-y-6">
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Date of Birth
            </label>
            <input
              type="date"
              required
              value={formData.date_of_birth}
              onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              className="cosmic-input w-full"
            />
          </div>

          {/* Time of Birth */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Time of Birth
            </label>
            <input
              type="time"
              required
              value={formData.time_of_birth}
              onChange={(e) => setFormData({ ...formData, time_of_birth: e.target.value })}
              className="cosmic-input w-full"
            />
          </div>

          {/* Place of Birth */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Place of Birth
            </label>
            <input
              type="text"
              required
              placeholder="e.g., New Delhi, India"
              value={formData.place_of_birth}
              onChange={(e) => setFormData({ ...formData, place_of_birth: e.target.value })}
              className="cosmic-input w-full"
            />
            <p className="text-xs text-white/50 mt-1">
              Enter city and country for accurate calculations
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="cosmic-button w-full text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner mr-2"></div>
                Calculating...
              </div>
            ) : (
              'Calculate My Chart'
            )}
          </button>

          {/* Privacy Note */}
          <p className="text-xs text-white/50 text-center">
            Your data is processed securely and never shared with third parties
          </p>
        </form>

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'AI-Powered', description: 'Sarvam AI analysis' },
            { title: 'Comprehensive', description: 'Past, present, future' },
            { title: 'Personalized', description: 'Unique to you' },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="text-center p-4 bg-white/5 rounded-lg"
            >
              <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
              <p className="text-sm text-white/60">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
