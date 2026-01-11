'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ArrowLeft, Loader2, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import InteractiveAnalyticsDashboard from '../components/InteractiveAnalyticsDashboard';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { astrologyAPI } from '@/lib/api';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { encryptionKey, isSetup, isLoading: encryptionLoading, isUnlocked } = useEncryption();
  const router = useRouter();

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

  useEffect(() => {
    if (encryptionKey) {
      loadAnalyticsData();
    }
  }, [encryptionKey]);

  const loadAnalyticsData = async () => {
    if (!encryptionKey) return;

    try {
      setLoading(true);
      setError(null);

      const profile = await loadCurrentProfile(encryptionKey);
      if (!profile) {
        setError('Please complete your profile first');
        setLoading(false);
        return;
      }

      try {
        const requestData: any = {
          date_of_birth: profile.dateOfBirth,
          time_of_birth: profile.timeOfBirth,
          place_of_birth: profile.placeOfBirth,
        };

        if (
          typeof profile.latitude === 'number' &&
          typeof profile.longitude === 'number' &&
          !isNaN(profile.latitude) &&
          !isNaN(profile.longitude)
        ) {
          requestData.latitude = profile.latitude;
          requestData.longitude = profile.longitude;
        }

        const response = await astrologyAPI.calculateBirthChart(requestData);
        if (response && response.data) {
          setChartData(response.data);
          const generatedAnalytics = generateAnalyticsFromChart(response.data);
          setAnalytics(generatedAnalytics);
        }
      } catch (apiError) {
        console.warn('API call failed, using default analytics:', apiError);
        setAnalytics(getDefaultAnalytics());
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const generateAnalyticsFromChart = (chart: any) => {
    const strengths: string[] = [];
    const challenges: string[] = [];
    const opportunities: string[] = [];

    const planets = chart.planets || [];
    planets.forEach((planet: any) => {
      if (planet.is_exalted) {
        strengths.push(`${planet.name} in exaltation brings exceptional ${getPlanetTheme(planet.name)}`);
      }
      if (planet.is_debilitated) {
        challenges.push(`${planet.name} debilitated requires attention in ${getPlanetTheme(planet.name)}`);
      }
      if (planet.is_retrograde) {
        opportunities.push(`${planet.name} retrograde offers deep introspection in ${getPlanetTheme(planet.name)}`);
      }
    });

    const karmaScore = calculateKarmaScore(chart);
    const dharmaScore = calculateDharmaScore(chart);
    const mokshaScore = calculateMokshaScore(chart);

    return {
      strengths: strengths.length > 0 ? strengths : ['Strong foundation for growth', 'Natural resilience', 'Balanced energy'],
      challenges: challenges.length > 0 ? challenges : ['Minor obstacles to overcome', 'Growth opportunities', 'Character building'],
      opportunities: opportunities.length > 0 ? opportunities : ['Potential for transformation', 'Spiritual evolution', 'Life mastery'],
      karmaScore,
      dharmaScore,
      mokshaScore,
    };
  };

  const getPlanetTheme = (planet: string): string => {
    const themes: Record<string, string> = {
      Sun: 'leadership and vitality',
      Moon: 'emotions and intuition',
      Mars: 'action and courage',
      Mercury: 'communication and intellect',
      Jupiter: 'wisdom and expansion',
      Venus: 'love and harmony',
      Saturn: 'discipline and responsibility',
      Rahu: 'innovation and ambition',
      Ketu: 'spirituality and detachment',
    };
    return themes[planet] || 'personal development';
  };

  const calculateKarmaScore = (chart: any): number => {
    let score = 50;
    if (chart.houses && chart.houses[5]) score += 10;
    const saturn = chart.planets?.find((p: any) => p.name === 'Saturn');
    if (saturn) {
      if (saturn.house === 10 || saturn.house === 1) score += 15;
      if (saturn.is_retrograde) score -= 10;
    }
    const rahu = chart.planets?.find((p: any) => p.name === 'Rahu');
    if (rahu && (rahu.house === 6 || rahu.house === 8 || rahu.house === 12)) {
      score += 10;
    }
    return Math.max(0, Math.min(100, score));
  };

  const calculateDharmaScore = (chart: any): number => {
    let score = 50;
    if (chart.houses && chart.houses[8]) score += 15;
    const jupiter = chart.planets?.find((p: any) => p.name === 'Jupiter');
    if (jupiter) {
      if (jupiter.is_exalted) score += 20;
      if (jupiter.house === 9 || jupiter.house === 1) score += 15;
    }
    const sun = chart.planets?.find((p: any) => p.name === 'Sun');
    if (sun && (sun.house === 10 || sun.house === 9)) {
      score += 10;
    }
    return Math.max(0, Math.min(100, score));
  };

  const calculateMokshaScore = (chart: any): number => {
    let score = 50;
    if (chart.houses && chart.houses[11]) score += 15;
    const ketu = chart.planets?.find((p: any) => p.name === 'Ketu');
    if (ketu) {
      if (ketu.house === 12 || ketu.house === 9) score += 20;
      if (ketu.house === 8) score += 15;
    }
    const moon = chart.planets?.find((p: any) => p.name === 'Moon');
    if (moon && (moon.house === 12 || moon.house === 9)) {
      score += 10;
    }
    return Math.max(0, Math.min(100, score));
  };

  const getDefaultAnalytics = () => ({
    strengths: ['Natural resilience', 'Intuitive wisdom', 'Strong foundation', 'Balanced energy', 'Spiritual awareness'],
    challenges: ['Growth opportunities', 'Learning experiences', 'Character building', 'Self-discipline'],
    opportunities: ['Transformation potential', 'Spiritual evolution', 'Life mastery', 'Relationship deepening'],
    karmaScore: 60,
    dharmaScore: 65,
    mokshaScore: 55,
  });

  const handleRefresh = () => {
    loadAnalyticsData();
  };

  const handleExport = () => {
    if (!analytics) return;
    const exportData = {
      analytics,
      chartData: chartData || {},
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhriguwelt-analytics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Loading your analytics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
        <AnimatedBackground />
        <FloatingElements />
        <div className="genz-container py-8 relative z-10">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link href="/profile">
              <GenZButton variant="primary">Complete Profile</GenZButton>
            </Link>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

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
          className="mb-12 text-center"
        >
          <GenZBadge variant="neon" size="lg" className="mb-6">
            <BarChart3 className="w-5 h-5 mr-2" />
            Analytics
          </GenZBadge>
          <h1 className="genz-title mb-4">
            Your Cosmic Analytics
          </h1>
          <p className="text-xl text-white/80">
            Deep insights powered by Bhrigu Samhita & Nadi Jyotisha
          </p>
        </motion.div>

        {analytics && (
          <InteractiveAnalyticsDashboard
            analytics={analytics}
            chartData={chartData}
            onRefresh={handleRefresh}
            onExport={handleExport}
          />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
