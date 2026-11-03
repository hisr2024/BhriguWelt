'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Target, Heart, Sparkles,
  Star, Moon, Sun, Zap, Activity, BarChart3, PieChart, LineChart,
  ArrowUp, Info, Eye, EyeOff, Download, RefreshCw
} from 'lucide-react';
import GenZCard from './GenZCard';
import GenZBadge from './GenZBadge';
import GenZButton from './GenZButton';

interface AnalyticsData {
  strengths: string[];
  challenges: string[];
  opportunities: string[];
  karmaScore: number;
  dharmaScore: number;
  mokshaScore: number;
}

interface ChartDataProps {
  planets?: any[];
  houses?: any[];
  yogas?: any[];
  dasha?: any;
}

interface InteractiveAnalyticsDashboardProps {
  analytics: AnalyticsData;
  chartData?: ChartDataProps;
  onRefresh?: () => void;
  onExport?: () => void;
}

export default function InteractiveAnalyticsDashboard({
  analytics,
  chartData,
  onRefresh,
  onExport,
}: InteractiveAnalyticsDashboardProps) {
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'planetary'>('overview');
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [animatedScores, setAnimatedScores] = useState({ karma: 0, dharma: 0, moksha: 0 });

  // Animate scores on mount
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setAnimatedScores({
        karma: Math.round(analytics.karmaScore * progress),
        dharma: Math.round(analytics.dharmaScore * progress),
        moksha: Math.round(analytics.mokshaScore * progress),
      });

      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [analytics]);

  const toggleDetails = (key: string) => {
    setShowDetails(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Calculate overall wellness score
  const overallScore = useMemo(() => {
    return Math.round((analytics.karmaScore + analytics.dharmaScore + analytics.mokshaScore) / 3);
  }, [analytics]);

  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-400';
    if (score >= 60) return 'from-blue-500 to-cyan-400';
    if (score >= 40) return 'from-yellow-500 to-amber-400';
    return 'from-orange-500 to-red-400';
  };

  // Get score status
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { text: 'Excellent', icon: <TrendingUp className="w-4 h-4" /> };
    if (score >= 60) return { text: 'Good', icon: <TrendingUp className="w-4 h-4" /> };
    if (score >= 40) return { text: 'Fair', icon: <Activity className="w-4 h-4" /> };
    return { text: 'Growth Needed', icon: <TrendingDown className="w-4 h-4" /> };
  };

  // Planetary strength analysis
  const planetaryStrength = useMemo(() => {
    if (!chartData?.planets) return [];

    return chartData.planets.map((planet: any) => ({
      name: planet.name,
      strength: calculatePlanetStrength(planet),
      house: planet.house,
      sign: planet.sign,
      retrograde: planet.is_retrograde,
      exalted: planet.is_exalted,
      debilitated: planet.is_debilitated,
    }));
  }, [chartData]);

  function calculatePlanetStrength(planet: any): number {
    let strength = 50;
    if (planet.is_exalted) strength += 30;
    if (planet.is_debilitated) strength -= 30;
    if (planet.is_retrograde) strength -= 10;
    if (planet.house === 1 || planet.house === 10) strength += 20;
    if (planet.house === 6 || planet.house === 8 || planet.house === 12) strength -= 15;
    return Math.max(0, Math.min(100, strength));
  }

  const ScoreCircle = ({ score, label, icon, color }: any) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="45"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="45"
              stroke="url(#gradient-${label})"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              style={{
                strokeDasharray: circumference,
              }}
            />
            <defs>
              <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" className={`stop-color-${color}`} />
                <stop offset="100%" className={`stop-color-${color}-light`} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
              {score}
            </div>
            <div className="text-xs text-white/60">/ 100</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {icon}
          <span className="text-sm font-bold text-white">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">
            Analytics Dashboard
          </h2>
          <p className="text-white/60">
            Interactive insights into your cosmic blueprint
          </p>
        </div>
        <div className="flex gap-2">
          {onRefresh && (
            <GenZButton variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4" />
            </GenZButton>
          )}
          {onExport && (
            <GenZButton variant="outline" size="sm" onClick={onExport}>
              <Download className="w-4 h-4" />
            </GenZButton>
          )}
        </div>
      </div>

      {/* View Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['overview', 'detailed', 'planetary'].map((view) => (
          <GenZButton
            key={view}
            variant={selectedView === view ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSelectedView(view as any)}
            className="capitalize whitespace-nowrap"
          >
            {view === 'overview' && <BarChart3 className="w-4 h-4 mr-2" />}
            {view === 'detailed' && <PieChart className="w-4 h-4 mr-2" />}
            {view === 'planetary' && <LineChart className="w-4 h-4 mr-2" />}
            {view}
          </GenZButton>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Overview View */}
        {selectedView === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <GenZCard variant="gradient" className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Overall Cosmic Alignment</h3>
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className={`text-6xl font-display font-bold bg-gradient-to-r ${getScoreColor(
                    overallScore
                  )} bg-clip-text text-transparent`}
                >
                  {overallScore}
                </motion.div>
                <span className="text-2xl text-white/60 ml-2">/ 100</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                {getScoreStatus(overallScore).icon}
                <span className="text-lg text-white/80">{getScoreStatus(overallScore).text}</span>
              </div>
            </GenZCard>

            {/* Score Circles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GenZCard variant="glass">
                <div className="flex flex-col items-center py-6">
                  <ScoreCircle
                    score={animatedScores.karma}
                    label="Karma"
                    icon={<Target className="w-5 h-5 text-genz-electric-blue" />}
                    color="from-genz-electric-blue to-genz-mint-fresh"
                  />
                  <p className="text-sm text-white/60 mt-4 text-center px-4">
                    Your karmic balance and life lessons progress
                  </p>
                </div>
              </GenZCard>

              <GenZCard variant="glass">
                <div className="flex flex-col items-center py-6">
                  <ScoreCircle
                    score={animatedScores.dharma}
                    label="Dharma"
                    icon={<Heart className="w-5 h-5 text-genz-hot-pink" />}
                    color="from-genz-hot-pink to-genz-coral-pop"
                  />
                  <p className="text-sm text-white/60 mt-4 text-center px-4">
                    Your alignment with life purpose and duty
                  </p>
                </div>
              </GenZCard>

              <GenZCard variant="glass">
                <div className="flex flex-col items-center py-6">
                  <ScoreCircle
                    score={animatedScores.moksha}
                    label="Moksha"
                    icon={<Sparkles className="w-5 h-5 text-genz-purple-haze" />}
                    color="from-genz-purple-haze to-genz-lavender-dream"
                  />
                  <p className="text-sm text-white/60 mt-4 text-center px-4">
                    Your spiritual liberation and enlightenment path
                  </p>
                </div>
              </GenZCard>
            </div>

            {/* Strengths, Challenges, Opportunities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GenZCard variant="glass" className="group cursor-pointer" onClick={() => toggleDetails('strengths')}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Strengths</h3>
                    <GenZBadge variant="neon" size="sm">
                      {analytics.strengths.length}
                    </GenZBadge>
                  </div>
                  {showDetails.strengths ? <EyeOff className="w-4 h-4 ml-auto" /> : <Eye className="w-4 h-4 ml-auto" />}
                </div>
                <AnimatePresence>
                  {showDetails.strengths && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      {analytics.strengths.map((strength, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="text-sm text-white/80 flex items-start gap-2"
                        >
                          <Star className="w-4 h-4 text-genz-cyber-yellow flex-shrink-0 mt-0.5" />
                          {strength}
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </GenZCard>

              <GenZCard variant="glass" className="group cursor-pointer" onClick={() => toggleDetails('challenges')}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-400 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Challenges</h3>
                    <GenZBadge variant="neon" size="sm">
                      {analytics.challenges.length}
                    </GenZBadge>
                  </div>
                  {showDetails.challenges ? <EyeOff className="w-4 h-4 ml-auto" /> : <Eye className="w-4 h-4 ml-auto" />}
                </div>
                <AnimatePresence>
                  {showDetails.challenges && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      {analytics.challenges.map((challenge, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="text-sm text-white/80 flex items-start gap-2"
                        >
                          <Zap className="w-4 h-4 text-genz-sunset-orange flex-shrink-0 mt-0.5" />
                          {challenge}
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </GenZCard>

              <GenZCard variant="glass" className="group cursor-pointer" onClick={() => toggleDetails('opportunities')}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Opportunities</h3>
                    <GenZBadge variant="neon" size="sm">
                      {analytics.opportunities.length}
                    </GenZBadge>
                  </div>
                  {showDetails.opportunities ? <EyeOff className="w-4 h-4 ml-auto" /> : <Eye className="w-4 h-4 ml-auto" />}
                </div>
                <AnimatePresence>
                  {showDetails.opportunities && (
                    <motion.ul
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      {analytics.opportunities.map((opportunity, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="text-sm text-white/80 flex items-start gap-2"
                        >
                          <ArrowUp className="w-4 h-4 text-genz-electric-blue flex-shrink-0 mt-0.5" />
                          {opportunity}
                        </motion.li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </GenZCard>
            </div>
          </motion.div>
        )}

        {/* Detailed View */}
        {selectedView === 'detailed' && (
          <motion.div
            key="detailed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GenZCard variant="gradient">
              <h3 className="text-2xl font-bold text-white mb-6">Detailed Analysis</h3>

              <div className="space-y-6">
                {/* Karma Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-white">Karma Score</span>
                    <span className={`text-2xl font-bold bg-gradient-to-r ${getScoreColor(analytics.karmaScore)} bg-clip-text text-transparent`}>
                      {analytics.karmaScore}/100
                    </span>
                  </div>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getScoreColor(analytics.karmaScore)} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${analytics.karmaScore}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-sm text-white/60 mt-2">
                    Your karmic balance reflects past actions and present lessons. Focus on completing karmic cycles through conscious choices.
                  </p>
                </div>

                {/* Dharma Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-white">Dharma Score</span>
                    <span className={`text-2xl font-bold bg-gradient-to-r ${getScoreColor(analytics.dharmaScore)} bg-clip-text text-transparent`}>
                      {analytics.dharmaScore}/100
                    </span>
                  </div>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getScoreColor(analytics.dharmaScore)} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${analytics.dharmaScore}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    />
                  </div>
                  <p className="text-sm text-white/60 mt-2">
                    Your dharma alignment shows how well you're living your life purpose. Stay true to your soul's calling.
                  </p>
                </div>

                {/* Moksha Breakdown */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-white">Moksha Score</span>
                    <span className={`text-2xl font-bold bg-gradient-to-r ${getScoreColor(analytics.mokshaScore)} bg-clip-text text-transparent`}>
                      {analytics.mokshaScore}/100
                    </span>
                  </div>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${getScoreColor(analytics.mokshaScore)} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${analytics.mokshaScore}%` }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                    />
                  </div>
                  <p className="text-sm text-white/60 mt-2">
                    Your spiritual liberation score reflects your progress toward enlightenment and transcendence.
                  </p>
                </div>
              </div>
            </GenZCard>
          </motion.div>
        )}

        {/* Planetary View */}
        {selectedView === 'planetary' && (
          <motion.div
            key="planetary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <GenZCard variant="glass">
              <h3 className="text-2xl font-bold text-white mb-6">Planetary Strengths</h3>

              {planetaryStrength.length > 0 ? (
                <div className="space-y-4">
                  {planetaryStrength.map((planet, index) => (
                    <motion.div
                      key={planet.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${getScoreColor(planet.strength)} flex items-center justify-center`}>
                            {planet.name === 'Sun' && <Sun className="w-4 h-4 text-white" />}
                            {planet.name === 'Moon' && <Moon className="w-4 h-4 text-white" />}
                            {planet.name !== 'Sun' && planet.name !== 'Moon' && <Star className="w-4 h-4 text-white" />}
                          </div>
                          <div>
                            <span className="font-bold text-white">{planet.name}</span>
                            <div className="flex items-center gap-2 text-xs text-white/60">
                              <span>{planet.sign}</span>
                              <span>•</span>
                              <span>House {planet.house}</span>
                              {planet.retrograde && <GenZBadge variant="neon" size="sm">R</GenZBadge>}
                              {planet.exalted && <GenZBadge variant="neon" size="sm">EX</GenZBadge>}
                              {planet.debilitated && <GenZBadge variant="neon" size="sm">DB</GenZBadge>}
                            </div>
                          </div>
                        </div>
                        <span className={`text-lg font-bold bg-gradient-to-r ${getScoreColor(planet.strength)} bg-clip-text text-transparent`}>
                          {planet.strength}
                        </span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full bg-gradient-to-r ${getScoreColor(planet.strength)} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${planet.strength}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-white/60 text-center py-8">
                  Planetary data not available. Complete your birth chart for detailed analysis.
                </p>
              )}
            </GenZCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Banner */}
      <GenZCard variant="glass" className="border-l-4 border-genz-electric-blue">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-genz-electric-blue flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-white mb-1">About Your Analytics</h4>
            <p className="text-sm text-white/70">
              These scores are calculated based on your birth chart using traditional Bhrigu Samhita and Nadi Jyotisha principles.
              They provide insights into your karmic patterns, life purpose alignment, and spiritual evolution.
              All calculations are performed offline using ancient Vedic wisdom.
            </p>
          </div>
        </div>
      </GenZCard>
    </div>
  );
}
