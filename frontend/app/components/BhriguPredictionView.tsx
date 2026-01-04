'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, Download, Share2, BookOpen } from 'lucide-react';
import type { Profile } from '@/lib/types';

interface BhriguPredictionViewProps {
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  fetchPrediction: (profileData: any) => Promise<any>;
  profile: Profile | null;
}

export default function BhriguPredictionView({
  category,
  title,
  description,
  icon,
  fetchPrediction,
  profile
}: BhriguPredictionViewProps) {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [question, setQuestion] = useState('');

  useEffect(() => {
    if (profile) {
      loadPrediction();
    }
  }, [profile]);

  const loadPrediction = async (forceRegenerate = false) => {
    if (!profile) return;

    setLoading(true);
    setError(null);

    try {
      const profileData = {
        date_of_birth: profile.dateOfBirth,
        time_of_birth: profile.timeOfBirth,
        place_of_birth: profile.placeOfBirth,
        latitude: profile.latitude,
        longitude: profile.longitude,
        question: question || undefined,
        force_regenerate: forceRegenerate
      };

      const response = await fetchPrediction(profileData);

      if (response.status === 'success') {
        setPrediction(response.data);
        setFromCache(response.message?.includes('cache') || false);
      } else {
        setError(response.message || 'Failed to generate prediction');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (title: string, content: string) => {
    if (!content || content === '' || content.includes('See full analysis')) {
      return null;
    }

    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold text-cyan-400 mb-3 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-purple-400 rounded-full" />
          {title}
        </h3>
        <div className="prose prose-invert prose-cyan max-w-none">
          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    );
  };

  const renderPredictionContent = () => {
    if (!prediction) return null;

    const sections = Object.entries(prediction)
      .filter(([key, value]) =>
        key !== 'category' &&
        key !== 'title' &&
        key !== 'full_analysis' &&
        key !== 'metadata' &&
        key !== 'generated_at' &&
        typeof value === 'string' &&
        value.length > 0
      );

    return (
      <div className="space-y-6">
        {/* Full Analysis */}
        {prediction.full_analysis && (
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50
                        border border-cyan-500/20 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              {icon}
              Complete Analysis
            </h2>
            <div className="prose prose-invert prose-cyan max-w-none">
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {prediction.full_analysis}
              </div>
            </div>
          </div>
        )}

        {/* Individual Sections */}
        <div className="grid grid-cols-1 gap-6">
          {sections.map(([key, value]) => {
            const sectionTitle = key
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-gray-800/30 to-gray-900/30
                         border border-gray-700/50 rounded-xl p-6
                         hover:border-cyan-500/30 transition-all"
              >
                {renderSection(sectionTitle, value as string)}
              </motion.div>
            );
          })}
        </div>

        {/* Metadata */}
        {prediction.metadata && (
          <div className="mt-8 pt-6 border-t border-gray-700/50">
            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              {prediction.metadata.zodiac_sign && (
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">Zodiac:</span>
                  <span>{prediction.metadata.zodiac_sign}</span>
                </div>
              )}
              {prediction.metadata.nakshatra && (
                <div className="flex items-center gap-2">
                  <span className="text-purple-400">Nakshatra:</span>
                  <span>{prediction.metadata.nakshatra}</span>
                </div>
              )}
              {prediction.metadata.tradition && (
                <div className="flex items-center gap-2">
                  <span className="text-pink-400">Tradition:</span>
                  <span>{prediction.metadata.tradition}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-400 mb-4">Please create a profile to access predictions</p>
          <button
            onClick={() => window.location.href = '/profile'}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500
                     text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600
                     transition-all"
          >
            Create Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-b border-cyan-500/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-purple-500/20
                          rounded-2xl flex items-center justify-center">
              {icon}
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
              <p className="text-gray-400">{description}</p>
            </div>
          </div>

          {/* Question Input */}
          <div className="mt-6 flex gap-3">
            <input
              type="text"
              placeholder="Ask a specific question (optional)..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3
                       text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400
                       transition-colors"
            />
            <button
              onClick={() => loadPrediction(false)}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500
                       text-white rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-600
                       disabled:opacity-50 disabled:cursor-not-allowed transition-all
                       flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
          </div>

          {fromCache && (
            <div className="mt-3 text-sm text-cyan-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              Loaded from Bhrigu wisdom cache
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && !prediction && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
            <p className="text-lg text-gray-400">
              Consulting ancient Bhrigu Samhita wisdom...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This may take a moment as we generate your personalized prediction
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => loadPrediction(false)}
              className="mt-4 text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {prediction && !loading && renderPredictionContent()}

        {/* Actions */}
        {prediction && (
          <div className="mt-12 flex gap-4 justify-center">
            <button
              onClick={() => loadPrediction(true)}
              disabled={loading}
              className="px-6 py-3 bg-gray-700/50 border border-gray-600
                       text-white rounded-lg hover:bg-gray-700 transition-all
                       flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="w-5 h-5" />
              Regenerate
            </button>
            <button
              className="px-6 py-3 bg-gray-700/50 border border-gray-600
                       text-white rounded-lg hover:bg-gray-700 transition-all
                       flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              className="px-6 py-3 bg-gray-700/50 border border-gray-600
                       text-white rounded-lg hover:bg-gray-700 transition-all
                       flex items-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
