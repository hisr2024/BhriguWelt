'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  TrendingUp,
  Heart,
  DollarSign,
  Activity,
  Sparkles,
  ArrowLeft,
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZButton from '../components/GenZButton';
import GenZBadge from '../components/GenZBadge';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { loadCurrentProfile } from '@/lib/profileHelpers';
import { bhriguPredictionsAPI, BirthDetails } from '@/lib/api';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';
import Link from 'next/link';

interface LifeEventItem {
  period: string;
  description: string;
  probability?: string;
  timing?: string;
}

interface LifeEventsData {
  offline: boolean;
  career_milestones: LifeEventItem[];
  relationship_events: LifeEventItem[];
  health_alerts: LifeEventItem[];
  financial_events: LifeEventItem[];
}

const EventCard = ({
  event,
  index,
  color
}: {
  event: LifeEventItem;
  index: number;
  color: string;
}) => {
  const probabilityColors: Record<string, string> = {
    'High': 'text-genz-neon-green bg-genz-neon-green/10',
    'Medium': 'text-genz-cyber-yellow bg-genz-cyber-yellow/10',
    'Moderate': 'text-genz-cyber-yellow bg-genz-cyber-yellow/10',
    'Low': 'text-white/50 bg-white/5'
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${color}`} />
        <div className="flex-1">
          {event.period && (
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3 h-3 text-white/40" />
              <span className="text-xs text-white/50">{event.period}</span>
              {event.probability && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${probabilityColors[event.probability] || 'text-white/50 bg-white/5'}`}>
                  {event.probability}
                </span>
              )}
            </div>
          )}
          <p className="text-sm text-white/80 leading-relaxed">{event.description}</p>
          {event.timing && (
            <p className="text-xs text-white/50 mt-2 italic">{event.timing}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const SectionCard = ({
  title,
  icon,
  events,
  color,
  gradient,
  delay = 0
}: {
  title: string;
  icon: React.ReactNode;
  events: LifeEventItem[];
  color: string;
  gradient: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <GenZCard variant="neon" className="h-full">
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-white">{title}</h3>
          <p className="text-sm text-white/50">{events.length} predicted events</p>
        </div>
      </div>
      <div className="space-y-3">
        {events.map((event, i) => (
          <EventCard
            key={i}
            event={event}
            index={i}
            color={color}
          />
        ))}
      </div>
    </GenZCard>
  </motion.div>
);

export default function LifeEventsPage() {
  const [data, setData] = useState<LifeEventsData | null>(null);
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
      loadData();
    }
  }, [encryptionKey]);

  const parseEventItem = (item: string | any, defaultPeriod: string = ''): LifeEventItem => {
    if (typeof item === 'string') {
      // Try to extract period from the string
      const periodMatch = item.match(/^(\d{4}[-–]\d{4}|\d{4}|[A-Za-z]+ \d{4}|Ages? \d+[-–]\d+|\d+[-–]\d+ years?)/i);
      if (periodMatch) {
        return {
          period: periodMatch[0],
          description: item.replace(periodMatch[0], '').replace(/^[:\s-]+/, '').trim(),
          probability: 'Medium'
        };
      }
      return {
        period: defaultPeriod,
        description: item,
        probability: 'Medium'
      };
    }
    return {
      period: item.period || item.timing || defaultPeriod,
      description: item.description || item.event || item.content || String(item),
      probability: item.probability || 'Medium',
      timing: item.remedy || item.advice
    };
  };

  const loadData = async () => {
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

      const birthDetails: BirthDetails = {
        date_of_birth: profile.dateOfBirth,
        time_of_birth: profile.timeOfBirth,
        place_of_birth: profile.placeOfBirth,
        latitude: profile.latitude,
        longitude: profile.longitude,
      };

      try {
        const response = await bhriguPredictionsAPI.getLifeEvents(birthDetails);
        const prediction = normalizePredictionResponse<any>(response).prediction;

        const parsedData: LifeEventsData = {
          offline: false,
          career_milestones: parseEventSection(prediction, 'career'),
          relationship_events: parseEventSection(prediction, 'relationship'),
          health_alerts: parseEventSection(prediction, 'health'),
          financial_events: parseEventSection(prediction, 'financial')
        };

        setData(parsedData);
      } catch (apiError) {
        console.error('API error, using offline mode:', apiError);
        setData(getOfflineData());
      }
    } catch (error) {
      console.error('Error loading life events:', error);
      setError('Failed to load life events');
    } finally {
      setLoading(false);
    }
  };

  const parseEventSection = (prediction: any, section: string): LifeEventItem[] => {
    const data = prediction?.data || prediction;

    const sectionKeys = {
      'career': ['career_milestones', 'career_events', 'career'],
      'relationship': ['relationship_events', 'marriage_timing', 'relationships', 'children_family'],
      'health': ['health_alerts', 'health_events', 'health'],
      'financial': ['financial_events', 'finance_events', 'finance', 'wealth']
    };

    const keys = sectionKeys[section as keyof typeof sectionKeys] || [];

    for (const key of keys) {
      if (data?.[key]) {
        const items = Array.isArray(data[key]) ? data[key] : [data[key]];
        return items.map((item: any, i: number) => parseEventItem(item, `Period ${i + 1}`));
      }
    }

    return getDefaultEvents(section);
  };

  const getDefaultEvents = (section: string): LifeEventItem[] => {
    const defaults: Record<string, LifeEventItem[]> = {
      career: [
        { period: 'Ages 28-32', description: 'Major career advancement and leadership opportunities emerge during favorable planetary transits.', probability: 'High' },
        { period: 'Ages 35-40', description: 'Peak professional recognition. Saturn returns bring maturity and authority in your field.', probability: 'High' },
        { period: 'Ages 42-48', description: 'Career transition or expansion into new domains. Jupiter transit supports growth.', probability: 'Medium' }
      ],
      relationship: [
        { period: 'Venus Mahadasha', description: 'Significant relationship developments. Favorable period for commitment and partnership.', probability: 'High' },
        { period: 'Jupiter Transit', description: 'Family expansion possibilities. Deepening of existing bonds and new connections.', probability: 'Medium' },
        { period: 'Ongoing', description: 'Soul connections manifest throughout your karmic journey. Stay open to meaningful encounters.', probability: 'Medium' }
      ],
      health: [
        { period: 'Seasonal Changes', description: 'Monitor energy levels during planetary transitions. Prevention is key.', probability: 'Medium', timing: 'Maintain consistent wellness routines' },
        { period: 'Favorable Dashas', description: 'Vitality peaks during supportive planetary periods. Good time for health investments.', probability: 'High' },
        { period: 'Ongoing', description: 'Regular exercise and spiritual practice enhance overall wellbeing and longevity.', probability: 'High' }
      ],
      financial: [
        { period: 'Jupiter Transit', description: 'Income increase and investment opportunities indicated during favorable Jupiter periods.', probability: 'High' },
        { period: 'Ages 30-45', description: 'Prime wealth-building years. Strategic planning yields long-term prosperity.', probability: 'High' },
        { period: 'Saturn Mahadasha', description: 'Property acquisition timing favorable. Real estate investments show stability.', probability: 'Medium' }
      ]
    };

    return defaults[section] || [];
  };

  const getOfflineData = (): LifeEventsData => ({
    offline: true,
    career_milestones: getDefaultEvents('career'),
    relationship_events: getDefaultEvents('relationship'),
    health_alerts: getDefaultEvents('health'),
    financial_events: getDefaultEvents('financial')
  });

  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Analyzing your life events...</div>
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
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
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

  const sections = [
    {
      title: 'Career Milestones',
      icon: <TrendingUp className="w-7 h-7 text-white" />,
      events: data?.career_milestones || [],
      color: 'bg-genz-electric-blue',
      gradient: 'from-genz-electric-blue to-genz-mint-fresh',
    },
    {
      title: 'Relationship Events',
      icon: <Heart className="w-7 h-7 text-white" />,
      events: data?.relationship_events || [],
      color: 'bg-genz-hot-pink',
      gradient: 'from-genz-hot-pink to-genz-coral-pop',
    },
    {
      title: 'Health Guidance',
      icon: <Activity className="w-7 h-7 text-white" />,
      events: data?.health_alerts || [],
      color: 'bg-genz-neon-green',
      gradient: 'from-genz-neon-green to-genz-lime-zest',
    },
    {
      title: 'Financial Events',
      icon: <DollarSign className="w-7 h-7 text-white" />,
      events: data?.financial_events || [],
      color: 'bg-genz-cyber-yellow',
      gradient: 'from-genz-cyber-yellow to-genz-sunset-orange',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="genz-container py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link href="/dashboard">
            <GenZButton variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </GenZButton>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <GenZBadge variant={data?.offline ? 'default' : 'neon'} pulse={!data?.offline}>
              {data?.offline ? 'Offline Mode' : 'Live Predictions'}
            </GenZBadge>
          </div>

          <h1 className="genz-title mb-3">Life Events Timeline</h1>
          <p className="text-lg text-white/70">
            Important milestones and transitions predicted using Dasha timing
          </p>
        </motion.div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GenZCard variant="gradient" className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-genz-cyber-yellow" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Predictive Timeline</h2>
                <p className="text-sm text-white/60">Based on Bhrigu Samhita & Nadi Jyotisha</p>
              </div>
            </div>
            <p className="text-white/80 leading-relaxed">
              Your life events are analyzed through the lens of planetary Dashas and transits.
              These predictions highlight significant periods for career growth, relationships,
              health awareness, and financial opportunities.
            </p>
          </GenZCard>
        </motion.div>

        {/* Event Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {sections.map((section, index) => (
            <SectionCard
              key={index}
              title={section.title}
              icon={section.icon}
              events={section.events}
              color={section.color}
              gradient={section.gradient}
              delay={index * 0.1 + 0.2}
            />
          ))}
        </div>

        {/* Explore More */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/karmic-journey">
            <GenZCard variant="glass" className="group cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-genz-electric-blue transition-colors">
                    Explore Your Karmic Journey
                  </h3>
                  <p className="text-sm text-white/60">
                    Understand the deeper patterns behind these events
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-genz-electric-blue group-hover:translate-x-1 transition-all" />
              </div>
            </GenZCard>
          </Link>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
