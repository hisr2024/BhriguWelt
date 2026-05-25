'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ArrowLeft, Loader2, Users, FileText, Activity, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, subMonths } from 'date-fns';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import GenZCard from '../components/GenZCard';
import BottomNav from '../components/BottomNav';
import InteractiveAnalyticsDashboard from '../components/InteractiveAnalyticsDashboard';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { astrologyAPI } from '@/lib/api';
import { countItems, getAnalyticsCache, setAnalyticsCache, clearAnalyticsCache, STORES } from '@/lib/storage';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileStats, setProfileStats] = useState({ profiles: 0, reports: 0 });
  const [dataSource, setDataSource] = useState<'loading' | 'cache' | 'api' | 'fallback'>('loading');
  const [timelineRange, setTimelineRange] = useState({ startIndex: 0, endIndex: 11 });
  const [isTimelineDragging, setIsTimelineDragging] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | number | null>(null);
  const [timelineMetric, setTimelineMetric] = useState<'karma' | 'dharma' | 'moksha'>('karma');
  const [timelineGranularity, setTimelineGranularity] = useState<'monthly' | 'yearly'>('monthly');
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

  const loadAnalyticsData = async (forceRefresh = false) => {
    if (!encryptionKey) return;

    try {
      setLoading(true);
      setError(null);
      setDataSource('loading');

      const profile = await loadCurrentProfile(encryptionKey);
      if (!profile) {
        setError('Please complete your profile first');
        setLoading(false);
        return;
      }

      setActiveProfileId(profile.id ?? null);

      const [profileCount, reportCount] = await Promise.all([
        countItems(STORES.PROFILES),
        countItems(STORES.REPORTS),
      ]);

      setProfileStats({ profiles: profileCount, reports: reportCount });

      const cacheKey = profile.id ? `analytics:${profile.id}` : 'analytics:current';
      if (!forceRefresh) {
        const cached = await getAnalyticsCache(cacheKey, encryptionKey);
        if (cached?.analytics) {
          setAnalytics(cached.analytics);
          setChartData(cached.chartData || null);
          setDataSource('cache');
          setLoading(false);
          return;
        }
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
          setDataSource('api');
          await setAnalyticsCache(
            cacheKey,
            {
              analytics: generatedAnalytics,
              chartData: response.data,
              profileId: profile.id,
              source: 'api',
            },
            encryptionKey
          );
        }
      } catch (apiError) {
        console.warn('API call failed, using default analytics:', apiError);
        const fallbackAnalytics = getDefaultAnalytics();
        setAnalytics(fallbackAnalytics);
        setDataSource('fallback');
        await setAnalyticsCache(
          cacheKey,
          {
            analytics: fallbackAnalytics,
            chartData: null,
            profileId: profile.id,
            source: 'fallback',
          },
          encryptionKey
        );
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
    if (!encryptionKey || !analytics) {
      loadAnalyticsData(true);
      return;
    }

    const cacheKey = activeProfileId ? `analytics:${activeProfileId}` : 'analytics:current';
    clearAnalyticsCache(cacheKey).finally(() => loadAnalyticsData(true));
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

  const profileMetrics = useMemo(() => {
    return [
      {
        label: 'Profiles',
        value: profileStats.profiles,
        icon: <Users className="w-5 h-5 text-genz-electric-blue" />,
      },
      {
        label: 'Reports',
        value: profileStats.reports,
        icon: <FileText className="w-5 h-5 text-genz-hot-pink" />,
      },
      {
        label: 'Insights Generated',
        value: analytics ? analytics.strengths.length + analytics.challenges.length + analytics.opportunities.length : 0,
        icon: <Sparkles className="w-5 h-5 text-genz-cyber-yellow" />,
      },
    ];
  }, [analytics, profileStats]);

  const timelineData = useMemo(() => {
    if (!analytics) return [];
    const now = new Date();
    const baseScores = {
      karma: analytics.karmaScore,
      dharma: analytics.dharmaScore,
      moksha: analytics.mokshaScore,
    };
    const variation = (analytics.dharmaScore - analytics.mokshaScore) / 8;
    const points = timelineGranularity === 'monthly' ? 12 : 5;

    return Array.from({ length: points }, (_, index) => {
      const offset = points - 1 - index;
      const date = subMonths(now, timelineGranularity === 'monthly' ? offset : offset * 12);
      const wobble = (index * 7 + baseScores.karma) % 12;
      const intensity = Math.min(100, Math.max(20, Math.round(baseScores[timelineMetric] + variation + wobble)));
      const karmaTrend = Math.min(100, Math.max(20, Math.round(baseScores.karma + wobble)));
      const dharmaTrend = Math.min(100, Math.max(20, Math.round(baseScores.dharma + variation + wobble)));
      const mokshaTrend = Math.min(100, Math.max(20, Math.round(baseScores.moksha + variation - wobble / 2)));

      return {
        month: timelineGranularity === 'monthly' ? format(date, 'MMM yy') : format(date, 'yyyy'),
        intensity,
        karma: karmaTrend,
        dharma: dharmaTrend,
        moksha: mokshaTrend,
      };
    });
  }, [analytics, timelineGranularity, timelineMetric]);

  const trendChartData = useMemo(() => {
    if (!analytics) return [];
    return timelineData.map((item) => ({
      label: item.month,
      karma: item.karma,
      dharma: item.dharma,
      moksha: item.moksha,
    }));
  }, [analytics, timelineData]);

  const lifeAreaData = useMemo(() => {
    if (!analytics) return [];
    const avg = Math.round((analytics.karmaScore + analytics.dharmaScore + analytics.mokshaScore) / 3);
    const clamp = (value: number) => Math.max(10, Math.min(100, value));
    return [
      { name: 'Career', value: clamp(avg + analytics.karmaScore / 4) },
      { name: 'Relationships', value: clamp(avg + analytics.dharmaScore / 6) },
      { name: 'Wellness', value: clamp(avg + analytics.mokshaScore / 5) },
      { name: 'Creativity', value: clamp(avg + analytics.karmaScore / 6) },
      { name: 'Spirituality', value: clamp(avg + analytics.mokshaScore / 3) },
    ];
  }, [analytics]);

  const selectedTimelineSummary = useMemo(() => {
    if (!timelineData.length) return { average: 0, range: '—' };
    const start = timelineRange.startIndex ?? 0;
    const end = timelineRange.endIndex ?? timelineData.length - 1;
    const slice = timelineData.slice(start, end + 1);
    const average =
      slice.reduce((sum, item) => sum + item.intensity, 0) / Math.max(1, slice.length);
    const range = `${slice[0]?.month ?? ''} - ${slice[slice.length - 1]?.month ?? ''}`;
    return { average: Math.round(average), range };
  }, [timelineData, timelineRange]);

  useEffect(() => {
    if (!timelineData.length) return;
    setTimelineRange((prev) => {
      const maxIndex = timelineData.length - 1;
      const startIndex = Math.min(prev.startIndex, maxIndex);
      const endIndex = Math.min(prev.endIndex, maxIndex);
      if (startIndex > endIndex) {
        return { startIndex: 0, endIndex: maxIndex };
      }
      return { startIndex, endIndex };
    });
  }, [timelineData.length]);

  const timelineMetricLabel = useMemo(() => {
    const labels = {
      karma: 'Karma',
      dharma: 'Dharma',
      moksha: 'Moksha',
    };
    return labels[timelineMetric];
  }, [timelineMetric]);

  const timelineChartPath = useMemo(() => {
    if (!timelineData.length) return '';
    const points = timelineData.map((point, index) => {
      const x = (index / Math.max(1, timelineData.length - 1)) * 100;
      const y = 100 - (point.intensity / 100) * 100;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  }, [timelineData]);

  const timelineFillPath = useMemo(() => {
    if (!timelineData.length) return '';
    const points = timelineData.map((point, index) => {
      const x = (index / Math.max(1, timelineData.length - 1)) * 100;
      const y = 100 - (point.intensity / 100) * 100;
      return `${x},${y}`;
    });
    return `M 0,100 L ${points.join(' L ')} L 100,100 Z`;
  }, [timelineData]);

  const trendPaths = useMemo(() => {
    if (!trendChartData.length) return {};
    const buildPath = (key: 'karma' | 'dharma' | 'moksha') => {
      const points = trendChartData.map((point, index) => {
        const x = (index / Math.max(1, trendChartData.length - 1)) * 100;
        const y = 100 - (point[key] / 100) * 100;
        return `${x},${y}`;
      });
      return {
        line: `M ${points.join(' L ')}`,
        area: `M 0,100 L ${points.join(' L ')} L 100,100 Z`,
      };
    };

    return {
      karma: buildPath('karma'),
      dharma: buildPath('dharma'),
      moksha: buildPath('moksha'),
    };
  }, [trendChartData]);

  const lifeAreaColors = ['#38BDF8', '#F472B6', '#34D399', '#FBBF24', '#A78BFA'];
  const lifeAreaGradient = useMemo(() => {
    if (!lifeAreaData.length) return '';
    const total = lifeAreaData.reduce((sum, item) => sum + item.value, 0);
    let cumulative = 0;
    return lifeAreaData
      .map((item, index) => {
        const start = (cumulative / total) * 100;
        cumulative += item.value;
        const end = (cumulative / total) * 100;
        return `${lifeAreaColors[index % lifeAreaColors.length]} ${start}% ${end}%`;
      })
      .join(', ');
  }, [lifeAreaData]);

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
          <div className="mt-4 flex items-center justify-center gap-3">
            <div data-testid="analytics-data-source">
              <GenZBadge variant="neon" size="sm">
                Source: {dataSource === 'cache' ? 'Cached' : dataSource === 'api' ? 'Live API' : dataSource === 'fallback' ? 'Fallback' : 'Loading'}
              </GenZBadge>
            </div>
            <span className="text-xs text-white/60">
              Timeline range: {selectedTimelineSummary.range}
            </span>
          </div>
        </motion.div>

        {analytics && (
          <div className="space-y-8 mb-12">
            <div className="grid gap-4 md:grid-cols-3">
              {profileMetrics.map((metric) => (
                <GenZCard key={metric.label} variant="glass" className="flex items-center gap-4 p-5">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    {metric.icon}
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-wide text-white/60">{metric.label}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                  </div>
                </GenZCard>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <GenZCard variant="gradient" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{timelineMetricLabel} Intensity Timeline</h3>
                  <p className="text-sm text-white/70">Track energy variations and focus windows.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/60">Avg. intensity</p>
                  <p className="text-2xl font-bold text-white">{selectedTimelineSummary.average}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {(['karma', 'dharma', 'moksha'] as const).map((metric) => (
                  <GenZButton
                    key={metric}
                    variant={timelineMetric === metric ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setTimelineMetric(metric)}
                    className="capitalize"
                  >
                    {metric}
                  </GenZButton>
                ))}
                <div className="ml-auto flex items-center gap-2">
                  {(['monthly', 'yearly'] as const).map((granularity) => (
                    <GenZButton
                      key={granularity}
                      variant={timelineGranularity === granularity ? 'outline' : 'ghost'}
                      size="sm"
                      onClick={() => setTimelineGranularity(granularity)}
                    >
                      {granularity === 'monthly' ? 'Monthly' : 'Yearly'}
                    </GenZButton>
                  ))}
                </div>
              </div>
              <div
                data-testid="timeline-slider"
                onMouseDown={() => setIsTimelineDragging(true)}
                onMouseUp={() => setIsTimelineDragging(false)}
                onMouseLeave={() => setIsTimelineDragging(false)}
                onTouchStart={() => setIsTimelineDragging(true)}
                onTouchEnd={() => setIsTimelineDragging(false)}
                className="h-72 w-full"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <linearGradient id="timeline-fill" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={timelineFillPath} fill="url(#timeline-fill)" />
                  <path d={timelineChartPath} fill="none" stroke="#EC4899" strokeWidth="2" />
                </svg>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{timelineData[0]?.month}</span>
                  <span>{timelineData[timelineData.length - 1]?.month}</span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs text-white/60">
                    Start range
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, timelineData.length - 1)}
                      value={timelineRange.startIndex}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setTimelineRange((prev) => ({
                          startIndex: Math.min(value, prev.endIndex),
                          endIndex: prev.endIndex,
                        }));
                      }}
                      className="mt-2 w-full accent-genz-electric-blue"
                    />
                  </label>
                  <label className="text-xs text-white/60">
                    End range
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, timelineData.length - 1)}
                      value={timelineRange.endIndex}
                      onChange={(event) => {
                        const value = Number(event.target.value);
                        setTimelineRange((prev) => ({
                          startIndex: prev.startIndex,
                          endIndex: Math.max(value, prev.startIndex),
                        }));
                      }}
                      className="mt-2 w-full accent-genz-hot-pink"
                    />
                  </label>
                </div>
              </div>
              <p className="mt-3 text-xs text-white/60" data-testid="timeline-drag-status">
                Timeline drag: {isTimelineDragging ? 'active' : 'idle'}
              </p>
              <p className="mt-1 text-xs text-white/60" data-testid="timeline-granularity-label">
                Granularity: {timelineGranularity === 'monthly' ? 'Monthly' : 'Yearly'}
              </p>
              </GenZCard>

              <GenZCard variant="glass" className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Life Area Insights</h3>
                  <p className="text-sm text-white/60">Balance across the key pillars of your journey.</p>
                </div>
                <div className="flex items-center justify-center">
                  <div className="relative w-44 h-44">
                    <div
                      className="w-44 h-44 rounded-full"
                      style={{ background: `conic-gradient(${lifeAreaGradient})` }}
                    />
                    <div className="absolute inset-6 rounded-full bg-dark-base/90" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-xs text-white/60">Balance</span>
                      <span className="text-2xl font-bold text-white">
                        {Math.round(lifeAreaData.reduce((sum, item) => sum + item.value, 0) / Math.max(1, lifeAreaData.length))}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {lifeAreaData.map((area, index) => (
                    <div key={area.name} className="flex items-center justify-between text-sm text-white/70">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-2 w-2 rounded-full"
                          style={{ backgroundColor: lifeAreaColors[index % lifeAreaColors.length] }}
                        />
                        <span>{area.name}</span>
                      </div>
                      <span className="font-semibold text-white">{area.value}</span>
                    </div>
                  ))}
                </div>
              </GenZCard>
            </div>

            <GenZCard variant="glass" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Karmic Flow Snapshot</h3>
                <p className="text-sm text-white/60">Compare karma, dharma, and moksha trends.</p>
              </div>
              <Activity className="w-5 h-5 text-genz-electric-blue" />
            </div>
            <div className="h-64">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="trend-karma" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trend-dharma" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F472B6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="trend-moksha" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0F172A" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {trendPaths.karma && (
                  <>
                    <path d={trendPaths.karma.area} fill="url(#trend-karma)" />
                    <path d={trendPaths.karma.line} fill="none" stroke="#38BDF8" strokeWidth="1.6" />
                  </>
                )}
                {trendPaths.dharma && (
                  <>
                    <path d={trendPaths.dharma.area} fill="url(#trend-dharma)" />
                    <path d={trendPaths.dharma.line} fill="none" stroke="#F472B6" strokeWidth="1.6" />
                  </>
                )}
                {trendPaths.moksha && (
                  <>
                    <path d={trendPaths.moksha.area} fill="url(#trend-moksha)" />
                    <path d={trendPaths.moksha.line} fill="none" stroke="#A78BFA" strokeWidth="1.6" />
                  </>
                )}
              </svg>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/60">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#38BDF8]" />
                Karma
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#F472B6]" />
                Dharma
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#A78BFA]" />
                Moksha
              </span>
            </div>
            </GenZCard>

            <GenZCard variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Profile Momentum</h3>
                  <p className="text-sm text-white/60">Snapshot of profile and report activity.</p>
                </div>
                <Activity className="w-5 h-5 text-genz-mint-fresh" />
              </div>
              <div className="h-52">
                <div className="flex h-full items-end gap-4">
                  {profileMetrics.map((metric) => (
                    <div key={metric.label} className="flex flex-1 flex-col items-center gap-2">
                      <div className="relative h-full w-full rounded-2xl bg-white/10">
                        <div
                          className="absolute bottom-0 w-full rounded-2xl bg-gradient-to-t from-genz-electric-blue to-genz-mint-fresh"
                          style={{
                            height: `${Math.min(100, metric.value * 10)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-white/60 text-center">{metric.label}</span>
                      <span className="text-sm font-semibold text-white">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GenZCard>
          </div>
        )}

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
