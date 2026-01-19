'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ArrowLeft,
  Moon,
  Sun,
  Zap,
  Loader2,
  Heart,
  Briefcase,
  Activity,
  TrendingUp,
  Clock,
  Compass,
  Sparkles,
  ChevronRight,
  Calendar,
  Target,
  Flame
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { predictionsAPI, ChartData, HoroscopeResult } from '@/lib/api/predictions';

type TimeframeType = 'today' | 'week' | 'month' | 'year';

interface CategoryData {
  rating: number;
  message: string;
  summary?: string;
  key_day?: string;
}

interface HoroscopeData {
  zodiacSign: string;
  timeframe: TimeframeType;
  overall: {
    energy: string;
    message: string;
    rating: number;
  };
  theme?: {
    title: string;
    summary: string;
    focus?: string;
    keywords?: string[];
  };
  categories: {
    love: CategoryData;
    career: CategoryData;
    health: CategoryData;
    finance: CategoryData;
  };
  luckyElements: {
    number: number;
    color: string;
    time: string;
    direction: string;
  };
  mantra: string;
  guidance: string;
  // Weekly specific
  dailySummaries?: Array<{
    date: string;
    day: string;
    energy: string;
    focus: string;
  }>;
  bestDay?: string;
  challengingDay?: string;
  // Monthly specific
  importantDates?: Array<{
    date: string;
    event: string;
    type: string;
  }>;
  powerDays?: string[];
  cautionDays?: string[];
  monthlyRitual?: {
    name: string;
    timing: string;
    mantra: string;
    benefit: string;
  };
  // Yearly specific
  quarters?: Array<{
    quarter: number;
    name: string;
    theme: string;
    summary: string;
    focusAreas: string[];
    energy: string;
  }>;
  keyMonths?: Array<{
    month: string;
    theme: string;
    energy: string;
  }>;
  annualRitual?: {
    name: string;
    bestTime: string;
    mantra: string;
    benefit: string;
  };
}

const TimeframeButton = ({
  active,
  onClick,
  icon,
  label,
  gradient
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  gradient: string;
}) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -2 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl font-medium transition-all border ${
      active
        ? `bg-gradient-to-br ${gradient} text-white border-white/20 shadow-lg`
        : 'bg-dark-card/50 text-white/70 hover:text-white border-white/5 hover:border-white/10'
    }`}
  >
    <motion.div
      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        active ? 'bg-white/20' : 'bg-white/5'
      }`}
    >
      {icon}
    </motion.div>
    <span className="text-sm">{label}</span>
    {active && (
      <motion.div
        layoutId="activeIndicator"
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white"
      />
    )}
  </motion.button>
);

const RatingStars = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) => {
  const starSize = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${starSize} ${
            i < rating
              ? 'fill-genz-cyber-yellow text-genz-cyber-yellow'
              : 'text-white/20'
          }`}
        />
      ))}
    </div>
  );
};

const CategoryCard = ({
  title,
  icon,
  rating,
  message,
  gradient,
  delay = 0
}: {
  title: string;
  icon: ReactNode;
  rating: number;
  message: string;
  gradient: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="relative overflow-hidden rounded-2xl border border-white/10 bg-dark-card/80 backdrop-blur-sm"
  >
    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            {icon}
          </div>
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <RatingStars rating={rating} />
      </div>
      <p className="text-white/80 text-sm leading-relaxed">{message}</p>
    </div>
  </motion.div>
);

const ThemeCard = ({
  title,
  summary,
  keywords,
  focus
}: {
  title: string;
  summary: string;
  keywords?: string[];
  focus?: string;
}) => (
  <GenZCard variant="gradient" className="mb-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
        <Target className="w-6 h-6 text-genz-electric-blue" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        {focus && <p className="text-sm text-white/60">Focus: {focus}</p>}
      </div>
    </div>
    <p className="text-white/85 leading-relaxed mb-3">{summary}</p>
    {keywords && keywords.length > 0 && (
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-full bg-white/10 text-sm text-white/80"
          >
            {keyword}
          </span>
        ))}
      </div>
    )}
  </GenZCard>
);

const WeekDayCard = ({
  day,
  date,
  energy,
  focus
}: {
  day: string;
  date: string;
  energy: string;
  focus: string;
}) => {
  const energyColors: Record<string, string> = {
    'Excellent': 'text-genz-neon-green',
    'High': 'text-genz-electric-blue',
    'Good': 'text-genz-cyber-yellow',
    'Moderate': 'text-genz-sunset-orange',
    'Low': 'text-white/50'
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-10 text-center">
          <span className="text-xs text-white/50 block">{day.slice(0, 3)}</span>
          <span className="text-sm font-medium text-white">{date.split('-')[2]}</span>
        </div>
        <span className="text-sm text-white/80">{focus}</span>
      </div>
      <span className={`text-sm font-medium ${energyColors[energy] || 'text-white/70'}`}>
        {energy}
      </span>
    </div>
  );
};

const QuarterCard = ({
  name,
  theme,
  summary,
  focusAreas,
  energy
}: {
  name: string;
  theme: string;
  summary: string;
  focusAreas: string[];
  energy: string;
}) => (
  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
    <div className="flex items-center justify-between mb-2">
      <span className="font-semibold text-white">{name}</span>
      <span className="text-xs px-2 py-1 rounded-full bg-genz-electric-blue/20 text-genz-electric-blue">
        {theme}
      </span>
    </div>
    <p className="text-sm text-white/70 mb-2">{summary}</p>
    <div className="flex flex-wrap gap-1">
      {focusAreas.map((area, i) => (
        <span key={i} className="text-xs text-white/50">
          {area}{i < focusAreas.length - 1 ? ' • ' : ''}
        </span>
      ))}
    </div>
  </div>
);

export default function HoroscopePage() {
  const [timeframe, setTimeframe] = useState<TimeframeType>('today');
  const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
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
      loadHoroscope();
    }
  }, [encryptionKey, timeframe]);

  const loadHoroscope = async () => {
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

      const chartData: ChartData = {
        date_of_birth: profile.dateOfBirth,
        time_of_birth: profile.timeOfBirth,
        place_of_birth: profile.placeOfBirth,
        latitude: profile.latitude,
        longitude: profile.longitude,
        zodiac_sign: profile.zodiacSign,
        moon_sign: profile.moonSign,
        nakshatra: profile.nakshatra,
        ascendant: profile.ascendant,
        dasha_period: profile.dashaPeriod,
      };

      try {
        const response = await predictionsAPI.getHoroscope(chartData, timeframe);
        setHoroscope(parseHoroscopeResponse(response, profile.zodiacSign || 'Aries', timeframe));
      } catch (apiError) {
        console.warn('API error, using offline fallback:', apiError);
        setHoroscope(getOfflineHoroscope(profile.zodiacSign || 'Aries', timeframe));
      }
    } catch (err) {
      console.error('Error loading horoscope:', err);
      setError('Failed to load horoscope');
    } finally {
      setLoading(false);
    }
  };

  const parseHoroscopeResponse = (
    response: HoroscopeResult,
    zodiacSign: string,
    tf: TimeframeType
  ): HoroscopeData => {
    const data = response?.data || {};
    const wisdom = getZodiacWisdom(zodiacSign);

    // Get the prediction text based on timeframe
    const predictionText = data.prediction ||
      data.daily_prediction ||
      data.weekly_prediction ||
      data.monthly_prediction ||
      data.yearly_prediction || '';

    // Parse sections from response
    const sections = data.sections || {};

    return {
      zodiacSign: data.zodiac_sign || zodiacSign,
      timeframe: tf,
      overall: data.overall || {
        energy: 'Positive',
        message: predictionText || getTimeframeMessage(tf, zodiacSign),
        rating: data.ratings?.overall || 4
      },
      theme: tf === 'week' ? data.weekly_theme :
             tf === 'month' ? data.monthly_theme :
             tf === 'year' ? data.yearly_theme : undefined,
      categories: {
        love: sections.love || {
          rating: data.ratings?.love || 4,
          message: getDefaultCategoryMessage('love', tf)
        },
        career: sections.career || {
          rating: data.ratings?.career || 4,
          message: getDefaultCategoryMessage('career', tf)
        },
        health: sections.health || {
          rating: data.ratings?.health || 4,
          message: getDefaultCategoryMessage('health', tf)
        },
        finance: sections.finance || {
          rating: data.ratings?.finance || 4,
          message: getDefaultCategoryMessage('finance', tf)
        }
      },
      luckyElements: data.lucky_elements || {
        number: wisdom.luckyNumbers[0],
        color: wisdom.colors[0],
        time: '7:00 AM',
        direction: 'East'
      },
      mantra: data.daily_mantra || wisdom.mantra,
      guidance: data.bhrigu_guidance || `Based on Bhrigu Samhita principles, ${zodiacSign} experiences cosmic alignment favoring growth.`,
      dailySummaries: data.daily_summaries?.map((d: any) => ({
        date: d.date,
        day: d.day,
        energy: d.energy,
        focus: d.focus
      })),
      bestDay: data.best_day,
      challengingDay: data.challenging_day,
      importantDates: data.important_dates?.map((d: any) => ({
        date: d.date,
        event: d.event,
        type: d.type
      })),
      powerDays: data.power_days,
      cautionDays: data.caution_days,
      monthlyRitual: data.monthly_ritual ? {
        name: data.monthly_ritual.name,
        timing: data.monthly_ritual.timing,
        mantra: data.monthly_ritual.mantra,
        benefit: data.monthly_ritual.benefit
      } : undefined,
      quarters: data.quarters?.map((q: any) => ({
        quarter: q.quarter,
        name: q.name,
        theme: q.theme,
        summary: q.summary,
        focusAreas: q.focus_areas || [],
        energy: q.energy
      })),
      keyMonths: data.key_months?.map((m: any) => ({
        month: m.month,
        theme: m.theme,
        energy: m.energy
      })),
      annualRitual: data.annual_ritual ? {
        name: data.annual_ritual.name,
        bestTime: data.annual_ritual.best_time,
        mantra: data.annual_ritual.mantra,
        benefit: data.annual_ritual.benefit
      } : undefined
    };
  };

  const getZodiacWisdom = (sign: string) => {
    const wisdom: Record<string, any> = {
      'Aries': { luckyNumbers: [1, 9], colors: ['Red', 'Orange'], mantra: 'Om Mangalaya Namaha' },
      'Taurus': { luckyNumbers: [2, 6], colors: ['Green', 'Pink'], mantra: 'Om Shukraya Namaha' },
      'Gemini': { luckyNumbers: [3, 5], colors: ['Yellow', 'Green'], mantra: 'Om Budhaya Namaha' },
      'Cancer': { luckyNumbers: [2, 7], colors: ['White', 'Silver'], mantra: 'Om Chandraya Namaha' },
      'Leo': { luckyNumbers: [1, 4], colors: ['Gold', 'Orange'], mantra: 'Om Suryaya Namaha' },
      'Virgo': { luckyNumbers: [5, 6], colors: ['Green', 'Brown'], mantra: 'Om Budhaya Namaha' },
      'Libra': { luckyNumbers: [6, 7], colors: ['Pink', 'Light Blue'], mantra: 'Om Shukraya Namaha' },
      'Scorpio': { luckyNumbers: [8, 9], colors: ['Deep Red', 'Black'], mantra: 'Om Mangalaya Namaha' },
      'Sagittarius': { luckyNumbers: [3, 9], colors: ['Purple', 'Blue'], mantra: 'Om Gurave Namaha' },
      'Capricorn': { luckyNumbers: [4, 8], colors: ['Brown', 'Black'], mantra: 'Om Shanaischaraya Namaha' },
      'Aquarius': { luckyNumbers: [4, 7], colors: ['Electric Blue', 'Violet'], mantra: 'Om Shanaischaraya Namaha' },
      'Pisces': { luckyNumbers: [3, 7], colors: ['Sea Green', 'Lavender'], mantra: 'Om Gurave Namaha' }
    };
    return wisdom[sign] || wisdom['Aries'];
  };

  const getTimeframeMessage = (tf: TimeframeType, sign: string): string => {
    const messages: Record<TimeframeType, string> = {
      today: `Today brings balanced cosmic energy for ${sign}. Focus on your core strengths and remain open to opportunities that align with your purpose.`,
      week: `This week emphasizes growth and connection for ${sign}. Build on momentum early in the week and allow time for reflection as the week closes.`,
      month: `This month offers expansion opportunities for ${sign}. Set clear intentions at the start and maintain focus through any challenges that arise.`,
      year: `This year marks significant transformation for ${sign}. Embrace change with confidence and trust your inner guidance through major transitions.`
    };
    return messages[tf];
  };

  const getDefaultCategoryMessage = (category: string, tf: TimeframeType): string => {
    const messages: Record<string, Record<TimeframeType, string>> = {
      love: {
        today: 'Express your heart openly today. Authentic communication strengthens bonds.',
        week: 'Relationship energy builds through the week. Quality time deepens connections.',
        month: 'Love opportunities expand this month. Stay open to meaningful encounters.',
        year: 'Significant relationship growth awaits. Commitment and depth characterize this year.'
      },
      career: {
        today: 'Professional momentum supports your efforts. Take initiative on key tasks.',
        week: 'Career progress accelerates mid-week. Strategic networking yields results.',
        month: 'Professional advancement indicated. Leadership opportunities emerge.',
        year: 'Career transformation unfolds. Major growth and recognition possible.'
      },
      health: {
        today: 'Vitality supports your activities. Balance energy with mindful rest.',
        week: 'Physical energy peaks mid-week. Establish sustainable wellness routines.',
        month: 'Overall health stable with focus on prevention. Mind-body balance essential.',
        year: 'Health journey requires consistent attention. Long-term wellness investments pay off.'
      },
      finance: {
        today: 'Financial awareness guides decisions. Avoid impulsive purchases.',
        week: 'Money matters improve through careful planning. Opportunities mid-week.',
        month: 'Financial stability indicated. Strategic investments favored.',
        year: 'Wealth building potential strong. Long-term planning yields prosperity.'
      }
    };
    return messages[category]?.[tf] || 'Positive energy supports your endeavors.';
  };

  const getOfflineHoroscope = (zodiacSign: string, tf: TimeframeType): HoroscopeData => {
    const wisdom = getZodiacWisdom(zodiacSign);
    const now = new Date();

    const base: HoroscopeData = {
      zodiacSign,
      timeframe: tf,
      overall: {
        energy: tf === 'today' ? 'Positive' : tf === 'week' ? 'Growing' : tf === 'month' ? 'Transformative' : 'Dynamic',
        message: getTimeframeMessage(tf, zodiacSign),
        rating: 4
      },
      categories: {
        love: { rating: 4, message: getDefaultCategoryMessage('love', tf) },
        career: { rating: 4, message: getDefaultCategoryMessage('career', tf) },
        health: { rating: 4, message: getDefaultCategoryMessage('health', tf) },
        finance: { rating: 4, message: getDefaultCategoryMessage('finance', tf) }
      },
      luckyElements: {
        number: wisdom.luckyNumbers[0],
        color: wisdom.colors[0],
        time: '7:00 AM',
        direction: 'East'
      },
      mantra: wisdom.mantra,
      guidance: `According to Bhrigu Samhita, ${zodiacSign} natives should honor cosmic energies through mindful action and regular spiritual practice.`
    };

    // Add timeframe-specific data
    if (tf === 'week') {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const focuses = ['Emotional Balance', 'Action & Energy', 'Communication', 'Expansion', 'Love & Harmony', 'Discipline', 'Self-Expression'];
      const energies = ['Good', 'High', 'Good', 'Excellent', 'High', 'Good', 'High'];

      base.theme = {
        title: 'Week of Growth',
        summary: `This week emphasizes personal development for ${zodiacSign}. Balance ambition with self-care.`,
        focus: 'Personal Development'
      };
      base.dailySummaries = days.map((day, i) => ({
        date: new Date(now.getTime() + (i - now.getDay() + 1) * 86400000).toISOString().split('T')[0],
        day,
        energy: energies[i],
        focus: focuses[i]
      }));
      base.bestDay = 'Friday';
      base.challengingDay = 'Saturday';
    }

    if (tf === 'month') {
      base.theme = {
        title: 'Month of Transformation',
        summary: `${now.toLocaleString('default', { month: 'long' })} brings opportunities for growth and change.`,
        keywords: ['Growth', 'Opportunity', 'Balance']
      };
      base.importantDates = [
        { date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, event: 'New Month Intentions', type: 'auspicious' },
        { date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-15`, event: 'Full Moon Energy Peak', type: 'powerful' },
        { date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-28`, event: 'Month End Reflection', type: 'completion' }
      ];
      base.powerDays = ['1', '8', '15', '22'];
      base.cautionDays = ['5', '19'];
      base.monthlyRitual = {
        name: 'Monthly Planetary Worship',
        timing: 'Every Friday morning',
        mantra: wisdom.mantra,
        benefit: 'Enhances positive planetary influences'
      };
    }

    if (tf === 'year') {
      base.theme = {
        title: `Year of ${now.getFullYear()} - Transformation`,
        summary: `${now.getFullYear()} brings significant opportunities for personal evolution and achievement.`,
        keywords: ['Transformation', 'Achievement', 'Growth', 'Wisdom']
      };
      base.quarters = [
        { quarter: 1, name: 'Q1 (Jan-Mar)', theme: 'Foundation', summary: 'Build strong foundations.', focusAreas: ['Planning', 'Structure'], energy: 'Building' },
        { quarter: 2, name: 'Q2 (Apr-Jun)', theme: 'Growth', summary: 'Expand your horizons.', focusAreas: ['Action', 'Expansion'], energy: 'Rising' },
        { quarter: 3, name: 'Q3 (Jul-Sep)', theme: 'Harvest', summary: 'Reap what you have sown.', focusAreas: ['Achievement', 'Recognition'], energy: 'Peak' },
        { quarter: 4, name: 'Q4 (Oct-Dec)', theme: 'Reflection', summary: 'Integrate lessons learned.', focusAreas: ['Wisdom', 'Preparation'], energy: 'Settling' }
      ];
      base.keyMonths = [
        { month: 'March', theme: 'New Beginnings', energy: 'High' },
        { month: 'June', theme: 'Peak Activity', energy: 'Excellent' },
        { month: 'September', theme: 'Harvest', energy: 'High' },
        { month: 'December', theme: 'Completion', energy: 'Reflective' }
      ];
      base.annualRitual = {
        name: 'Annual Planetary Alignment',
        bestTime: 'On your birthday',
        mantra: wisdom.mantra,
        benefit: 'Strengthens yearly protection and guidance'
      };
    }

    return base;
  };

  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Loading your predictions...</div>
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
          <GenZCard variant="glass" className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <Link href="/profile">
              <GenZButton variant="primary">Complete Profile</GenZButton>
            </Link>
          </GenZCard>
        </div>
        <BottomNav />
      </div>
    );
  }

  const timeframes = [
    { id: 'today' as TimeframeType, icon: <Sun className="w-5 h-5" />, label: 'Today', gradient: 'from-genz-cyber-yellow to-genz-sunset-orange' },
    { id: 'week' as TimeframeType, icon: <Moon className="w-5 h-5" />, label: 'This Week', gradient: 'from-genz-purple-haze to-genz-lavender-dream' },
    { id: 'month' as TimeframeType, icon: <Star className="w-5 h-5" />, label: 'This Month', gradient: 'from-genz-electric-blue to-genz-mint-fresh' },
    { id: 'year' as TimeframeType, icon: <Zap className="w-5 h-5" />, label: 'This Year', gradient: 'from-genz-hot-pink to-genz-coral-pop' }
  ];

  const timeframeTitles: Record<TimeframeType, string> = {
    today: "Today's Horoscope",
    week: "Weekly Forecast",
    month: "Monthly Outlook",
    year: "Yearly Overview"
  };

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="genz-container py-6 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <GenZButton variant="ghost" size="sm">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5" />
              Back
            </Link>
          </GenZButton>
          <GenZBadge variant="neon" size="sm" pulse>
            <Moon className="w-4 h-4 mr-1" />
            Horoscope
          </GenZBadge>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="genz-title mb-2">{timeframeTitles[timeframe]}</h1>
          <p className="text-white/70">Cosmic guidance based on Bhrigu Samhita</p>
        </motion.div>

        {/* Timeframe Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-4 gap-3 mb-8"
        >
          {timeframes.map((tf) => (
            <TimeframeButton
              key={tf.id}
              active={timeframe === tf.id}
              onClick={() => setTimeframe(tf.id)}
              icon={tf.icon}
              label={tf.label}
              gradient={tf.gradient}
            />
          ))}
        </motion.div>

        {horoscope && (
          <AnimatePresence mode="wait">
            <motion.div
              key={timeframe}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Sign and Overall Energy */}
              <GenZCard variant="gradient" className="mb-6 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-genz-cyber-yellow" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{horoscope.zodiacSign}</h2>
                      <p className="text-white/60 text-sm">Energy: {horoscope.overall.energy}</p>
                    </div>
                  </div>
                  <RatingStars rating={horoscope.overall.rating} size="lg" />
                </div>
                <p className="text-white/90 leading-relaxed">{horoscope.overall.message}</p>
              </GenZCard>

              {/* Theme Card (for week/month/year) */}
              {horoscope.theme && (
                <ThemeCard
                  title={horoscope.theme.title}
                  summary={horoscope.theme.summary}
                  keywords={horoscope.theme.keywords}
                  focus={horoscope.theme.focus}
                />
              )}

              {/* Weekly Daily Summaries */}
              {timeframe === 'week' && horoscope.dailySummaries && (
                <GenZCard variant="glass" className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-genz-purple-haze" />
                    Day-by-Day Overview
                  </h3>
                  <div className="space-y-0">
                    {horoscope.dailySummaries.map((day, i) => (
                      <WeekDayCard
                        key={i}
                        day={day.day}
                        date={day.date}
                        energy={day.energy}
                        focus={day.focus}
                      />
                    ))}
                  </div>
                  {horoscope.bestDay && horoscope.challengingDay && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                      <span className="text-genz-neon-green">Best: {horoscope.bestDay}</span>
                      <span className="text-genz-sunset-orange">Caution: {horoscope.challengingDay}</span>
                    </div>
                  )}
                </GenZCard>
              )}

              {/* Yearly Quarters */}
              {timeframe === 'year' && horoscope.quarters && (
                <GenZCard variant="glass" className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-genz-hot-pink" />
                    Quarterly Outlook
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {horoscope.quarters.map((q, i) => (
                      <QuarterCard
                        key={i}
                        name={q.name}
                        theme={q.theme}
                        summary={q.summary}
                        focusAreas={q.focusAreas}
                        energy={q.energy}
                      />
                    ))}
                  </div>
                </GenZCard>
              )}

              {/* Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <CategoryCard
                  title="Love"
                  icon={<Heart className="w-5 h-5 text-white" />}
                  rating={horoscope.categories.love.rating}
                  message={horoscope.categories.love.message}
                  gradient="from-genz-hot-pink to-genz-coral-pop"
                  delay={0.1}
                />
                <CategoryCard
                  title="Career"
                  icon={<Briefcase className="w-5 h-5 text-white" />}
                  rating={horoscope.categories.career.rating}
                  message={horoscope.categories.career.message}
                  gradient="from-genz-electric-blue to-genz-mint-fresh"
                  delay={0.15}
                />
                <CategoryCard
                  title="Health"
                  icon={<Activity className="w-5 h-5 text-white" />}
                  rating={horoscope.categories.health.rating}
                  message={horoscope.categories.health.message}
                  gradient="from-genz-neon-green to-genz-lime-zest"
                  delay={0.2}
                />
                <CategoryCard
                  title="Finance"
                  icon={<TrendingUp className="w-5 h-5 text-white" />}
                  rating={horoscope.categories.finance.rating}
                  message={horoscope.categories.finance.message}
                  gradient="from-genz-cyber-yellow to-genz-sunset-orange"
                  delay={0.25}
                />
              </div>

              {/* Monthly Important Dates */}
              {timeframe === 'month' && horoscope.importantDates && (
                <GenZCard variant="glass" className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-genz-electric-blue" />
                    Key Dates This Month
                  </h3>
                  <div className="space-y-3">
                    {horoscope.importantDates.map((date, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-white/80">{date.date.split('-')[2]}</span>
                          <span className="text-sm text-white/70">{date.event}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          date.type === 'powerful' ? 'bg-genz-cyber-yellow/20 text-genz-cyber-yellow' :
                          date.type === 'auspicious' ? 'bg-genz-neon-green/20 text-genz-neon-green' :
                          'bg-white/10 text-white/60'
                        }`}>
                          {date.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </GenZCard>
              )}

              {/* Yearly Key Months */}
              {timeframe === 'year' && horoscope.keyMonths && (
                <GenZCard variant="glass" className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-genz-sunset-orange" />
                    Key Months
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {horoscope.keyMonths.map((m, i) => (
                      <div key={i} className="text-center p-3 rounded-xl bg-white/5">
                        <span className="block text-sm font-medium text-white">{m.month}</span>
                        <span className="block text-xs text-white/60">{m.theme}</span>
                        <span className={`block text-xs mt-1 ${
                          m.energy === 'Excellent' ? 'text-genz-neon-green' :
                          m.energy === 'High' ? 'text-genz-electric-blue' :
                          'text-white/50'
                        }`}>{m.energy}</span>
                      </div>
                    ))}
                  </div>
                </GenZCard>
              )}

              {/* Lucky Elements */}
              <GenZCard variant="neon" className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-genz-cyber-yellow" />
                  Lucky Elements
                </h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-genz-electric-blue mb-1">
                      {horoscope.luckyElements.number}
                    </div>
                    <p className="text-xs text-white/60">Lucky Number</p>
                  </div>
                  <div>
                    <div className="w-6 h-6 rounded-full bg-genz-electric-blue mx-auto mb-1 shadow-genz-glow" />
                    <p className="text-xs text-white/60">{horoscope.luckyElements.color}</p>
                  </div>
                  <div>
                    <Clock className="w-6 h-6 text-genz-purple-haze mx-auto mb-1" />
                    <p className="text-xs text-white/60">{horoscope.luckyElements.time}</p>
                  </div>
                  <div>
                    <Compass className="w-6 h-6 text-genz-mint-fresh mx-auto mb-1" />
                    <p className="text-xs text-white/60">{horoscope.luckyElements.direction}</p>
                  </div>
                </div>
              </GenZCard>

              {/* Bhrigu Guidance */}
              <GenZCard variant="glass" className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                  <Moon className="w-5 h-5 text-genz-lavender-dream" />
                  Bhrigu Guidance
                </h3>
                <p className="text-white/80 leading-relaxed mb-4">{horoscope.guidance}</p>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    {timeframe === 'today' ? 'Daily' : timeframe === 'week' ? 'Weekly' : timeframe === 'month' ? 'Monthly' : 'Annual'} Mantra
                  </p>
                  <p className="text-lg font-medium text-genz-electric-blue">{horoscope.mantra}</p>
                </div>
              </GenZCard>

              {/* Monthly/Yearly Rituals */}
              {(horoscope.monthlyRitual || horoscope.annualRitual) && (
                <GenZCard variant="glass" className="mb-6">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-genz-cyber-yellow" />
                    {horoscope.monthlyRitual ? 'Monthly Ritual' : 'Annual Ritual'}
                  </h3>
                  {horoscope.monthlyRitual && (
                    <div className="space-y-2 text-sm">
                      <p className="text-white/80"><strong>Practice:</strong> {horoscope.monthlyRitual.name}</p>
                      <p className="text-white/80"><strong>Timing:</strong> {horoscope.monthlyRitual.timing}</p>
                      <p className="text-white/80"><strong>Mantra:</strong> {horoscope.monthlyRitual.mantra}</p>
                      <p className="text-white/60 italic">{horoscope.monthlyRitual.benefit}</p>
                    </div>
                  )}
                  {horoscope.annualRitual && (
                    <div className="space-y-2 text-sm">
                      <p className="text-white/80"><strong>Practice:</strong> {horoscope.annualRitual.name}</p>
                      <p className="text-white/80"><strong>Best Time:</strong> {horoscope.annualRitual.bestTime}</p>
                      <p className="text-white/80"><strong>Mantra:</strong> {horoscope.annualRitual.mantra}</p>
                      <p className="text-white/60 italic">{horoscope.annualRitual.benefit}</p>
                    </div>
                  )}
                </GenZCard>
              )}

              {/* Explore More */}
              <Link href="/bhrigu-predictions">
                <GenZCard variant="glass" className="group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-genz-electric-blue transition-colors">
                        Explore Deep Predictions
                      </h3>
                      <p className="text-sm text-white/60">
                        Karmic journey, past lives & more
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-genz-electric-blue group-hover:translate-x-1 transition-all" />
                  </div>
                </GenZCard>
              </Link>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
