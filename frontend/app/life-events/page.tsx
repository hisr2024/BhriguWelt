'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Calendar, TrendingUp, Heart, DollarSign, Activity, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZButton from '../components/GenZButton';
import GenZBadge from '../components/GenZBadge';
import BottomNav from '../components/BottomNav';
import CardSkeleton from '../components/CardSkeleton';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { getItem, STORES } from '@/lib/storage';
import { bhriguPredictionsAPI, BirthDetails } from '@/lib/api';
import { normalizePredictionResponse } from '@/lib/api/predictionResponse';
import Link from 'next/link';

export default function LifeEventsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wisdomCards, setWisdomCards] = useState<any[]>([]);
  const [wisdomLoading, setWisdomLoading] = useState(true);
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
    const loadWisdomCards = async () => {
      try {
        setWisdomLoading(true);
        const res = await fetch('/data/wisdom_cards.json');
        const data = await res.json();
        const filtered = data.filter((card: any) => 
          card.tradition === 'Bhrigu Samhita' ||
          card.category === 'astrology'
        );
        setWisdomCards(filtered);
      } catch (err) {
        console.error('Error loading wisdom cards:', err);
      } finally {
        setWisdomLoading(false);
      }
    };

    loadWisdomCards();
  }, []);

  useEffect(() => {
    if (encryptionKey) {
      loadData();
    }
  }, [encryptionKey]);

  const loadData = async () => {
    if (!encryptionKey) return;

    try {
      setLoading(true);
      setError(null);

      const profile = await getItem(STORES.PROFILES, 'current_profile', encryptionKey);
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
        
        // Parse the API response correctly
        const parsedData = {
          offline: false,
          career_milestones: parseLifeEventSection(prediction, 'career') || [
            'Career opportunities in the coming years',
            'Professional growth and advancement ahead'
          ],
          relationship_events: parseLifeEventSection(prediction, 'relationship') || [
            'Important relationships developing',
            'Deepening connections with loved ones'
          ],
          health_alerts: parseLifeEventSection(prediction, 'health') || [
            'Maintain balance in wellness',
            'Focus on preventive care'
          ],
          financial_events: parseLifeEventSection(prediction, 'financial') || [
            'Financial opportunities ahead',
            'Growing prosperity'
          ]
        };
        
        setData(parsedData);
      } catch (apiError) {
        console.error('API error, using offline mode:', apiError);
        // Fallback to offline wisdom
        setData({
          offline: true,
          career_milestones: [
            'Major career advancement in 2-3 years according to planetary transits',
            'Leadership opportunity emerging in your current dasha period',
            'Career transition possible around significant planetary alignment',
            'Recognition and awards likely in favorable dasha'
          ],
          relationship_events: [
            'Significant relationship potential in upcoming Venus period',
            'Important decisions about commitment during Jupiter transit',
            'Family expansion possible in favorable dasha combinations',
            'Deep soul connections manifesting throughout life journey'
          ],
          health_alerts: [
            'Monitor energy levels during planetary transitions',
            'Focus on preventive care and wellness practices',
            'Energy peaks during favorable planetary periods',
            'Regular exercise enhances vitality and strength'
          ],
          financial_events: [
            'Income increase indicated in next favorable dasha',
            'Investment opportunities during Jupiter transits',
            'Property acquisition timing favorable',
            'Financial stability strengthens with spiritual practice'
          ]
        });
      }
    } catch (error) {
      console.error('Error loading life events:', error);
      setError('Failed to load life events');
    } finally {
      setLoading(false);
    }
  };

  const parseLifeEventSection = (prediction: any, section: string): string[] | null => {
    // Try to extract section from structured response
    const data = prediction?.data || prediction;
    
    // Check for direct section data
    const milestones = normalizeList(data[`${section}_milestones`]);
    if (milestones) {
      return milestones;
    }
    const events = normalizeList(data[`${section}_events`]);
    if (events) {
      return events;
    }
    if (section === 'relationship') {
      const relationshipDetails = data?.marriage_timing ?? data?.children_family;
      const normalizedRelationship = normalizeList(relationshipDetails);
      if (normalizedRelationship) {
        return normalizedRelationship;
      }
    }
    if (section === 'career') {
      const normalizedCareer = normalizeList(data?.career_milestones);
      if (normalizedCareer) {
        return normalizedCareer;
      }
    }
    if (section === 'financial') {
      const normalizedFinance = normalizeList(data?.financial_events);
      if (normalizedFinance) {
        return normalizedFinance;
      }
    }
    if (section === 'health') {
      const normalizedHealth = normalizeList(data?.health_alerts);
      if (normalizedHealth) {
        return normalizedHealth;
      }
    }
    
    // Try to parse from life_events text
    const lifeEventsText = data?.life_events || data?.full_analysis || '';
    if (typeof lifeEventsText === 'string') {
      return parseTextSection(lifeEventsText, section);
    }
    
    return null;
  };

  // Constants for text parsing
  const MAX_MATCHED_LINES = 4;
  const MAX_SUBSTRING_LENGTH = 200;

  const parseTextSection = (text: string, section: string): string[] => {
    const sectionKeywords = {
      'career': ['career', 'professional', 'work', 'job'],
      'relationship': ['relationship', 'love', 'marriage', 'family'],
      'health': ['health', 'wellness', 'energy', 'fitness'],
      'financial': ['financial', 'money', 'wealth', 'income', 'finance']
    };
    
    const keywords = sectionKeywords[section as keyof typeof sectionKeywords] || [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const matchedLines: string[] = [];
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        matchedLines.push(line.trim());
        if (matchedLines.length >= MAX_MATCHED_LINES) break;
      }
    }
    
    return matchedLines.length > 0 ? matchedLines : [];
  };

  const normalizeList = (value: unknown): string[] | null => {
    if (Array.isArray(value)) {
      return value.filter((item) => typeof item === 'string' && item.trim().length > 0);
    }
    if (typeof value === 'string') {
      const lines = value
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      if (lines.length > 1) {
        return lines;
      }
      return [value];
    }
    return null;
  };

  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Predicting life events...</div>
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

  const sections = [
    {
      title: 'Career Milestones',
      icon: <TrendingUp className="w-6 h-6" />,
      content: data?.career_milestones,
      color: 'from-genz-electric-blue to-genz-mint-fresh',
    },
    {
      title: 'Relationship Events',
      icon: <Heart className="w-6 h-6" />,
      content: data?.relationship_events,
      color: 'from-genz-hot-pink to-genz-coral-pop',
    },
    {
      title: 'Health Alerts',
      icon: <Activity className="w-6 h-6" />,
      content: data?.health_alerts,
      color: 'from-genz-neon-green to-genz-lime-zest',
    },
    {
      title: 'Financial Events',
      icon: <DollarSign className="w-6 h-6" />,
      content: data?.financial_events,
      color: 'from-genz-cyber-yellow to-genz-sunset-orange',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden pb-24 md:pb-8">
      <AnimatedBackground />
      <FloatingElements />

      <div className="genz-container py-8 relative z-10">
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
            <GenZBadge variant="neon">
              {data?.offline ? 'Offline Mode' : 'Live'}
            </GenZBadge>
            <h1 className="genz-title">Life Events 📅</h1>
          </div>
          <p className="text-xl text-white/80">
            Important milestones and transitions with precision timing
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GenZCard variant="neon" className="h-full">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${section.color} flex items-center justify-center mb-4`}>
                  {section.icon}
                </div>
                <h3 className="text-2xl font-display font-bold mb-4 text-white">
                  {section.title}
                </h3>
                {Array.isArray(section.content) ? (
                  <ul className="space-y-2">
                    {section.content.map((item: string, i: number) => (
                      <li key={i} className="text-white/80 flex items-start gap-2">
                        <span className="text-genz-electric-blue mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-white/80">{section.content}</p>
                )}
              </GenZCard>
            </motion.div>
          ))}
        </div>

        {data?.offline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-3xl font-display font-bold mb-6 text-white">
              Timeline Wisdom
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wisdomLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <CardSkeleton key={index} />
                  ))
                : wisdomCards.slice(0, 4).map((card, index) => (
                    <GenZCard key={index} variant="glass">
                      <GenZBadge variant="default" size="sm" className="mb-3">
                        {card.tradition}
                      </GenZBadge>
                      <h4 className="text-xl font-bold mb-2 text-white">{card.title}</h4>
                      <p className="text-white/70 text-sm">{card.content}</p>
                    </GenZCard>
                  ))}
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
