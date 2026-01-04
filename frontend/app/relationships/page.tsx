'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Heart, Users, Sparkles, TrendingUp, ArrowLeft, Loader2 } from 'lucide-react';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZButton from '../components/GenZButton';
import GenZBadge from '../components/GenZBadge';
import BottomNav from '../components/BottomNav';
import { useEncryptionKey } from '@/lib/hooks/useEncryptedStorage';
import { getItem, STORES } from '@/lib/storage';
import { presentLifeAPI, BirthDetails } from '@/lib/api';
import Link from 'next/link';

export default function RelationshipsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wisdomCards, setWisdomCards] = useState<any[]>([]);
  const { encryptionKey, isSetup, isLoading: encryptionLoading } = useEncryptionKey();
  const router = useRouter();

  useEffect(() => {
    if (!encryptionLoading && !isSetup) {
      router.push('/setup-passcode');
    }
  }, [encryptionLoading, isSetup, router]);

  useEffect(() => {
    if (!encryptionLoading && isSetup && !encryptionKey) {
      router.push('/unlock');
    }
  }, [encryptionLoading, isSetup, encryptionKey, router]);

  useEffect(() => {
    fetch('/data/wisdom_cards.json')
      .then(res => res.json())
      .then(data => {
        const filtered = data.filter((card: any) => 
          card.tags.some((tag: string) => 
            tag.toLowerCase().includes('relationship') || 
            tag.toLowerCase().includes('love') ||
            tag.toLowerCase().includes('7th')
          )
        );
        setWisdomCards(filtered);
      })
      .catch(err => console.error('Error loading wisdom cards:', err));
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
        const analysis = await presentLifeAPI.getRelationshipsAnalysis(birthDetails);
        setData(analysis);
      } catch (apiError) {
        console.error('API error, using offline mode:', apiError);
        setData({
          offline: true,
          relationship_analysis: 'Your 7th house indicates deep, transformative relationships. You seek partners who challenge and inspire you to grow.',
          compatibility_insights: 'Best compatibility with water and earth signs. Look for partners who value emotional depth and stability.',
          romantic_patterns: [
            'You value authenticity and emotional honesty',
            'Deep connections over casual relationships',
            'Need for intellectual stimulation in partnerships',
            'Strong loyalty once committed'
          ],
          karmic_connections: [
            'You have karmic ties with several souls in this lifetime',
            'Past life connections may resurface',
            'Some relationships are here to teach important lessons',
            'Soul mate connections are highly probable'
          ],
          relationship_advice: [
            'Practice open communication',
            'Balance independence with intimacy',
            'Work through fears of vulnerability',
            'Trust your intuition about people'
          ]
        });
      }
    } catch (error) {
      console.error('Error loading relationships:', error);
      setError('Failed to load relationships analysis');
    } finally {
      setLoading(false);
    }
  };

  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Analyzing relationships...</div>
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
      title: 'Relationship Analysis',
      icon: <Heart className="w-6 h-6" />,
      content: data?.relationship_analysis,
      color: 'from-genz-hot-pink to-genz-coral-pop',
    },
    {
      title: 'Compatibility Insights',
      icon: <Users className="w-6 h-6" />,
      content: data?.compatibility_insights,
      color: 'from-genz-electric-blue to-genz-mint-fresh',
    },
    {
      title: 'Romantic Patterns',
      icon: <Sparkles className="w-6 h-6" />,
      content: data?.romantic_patterns,
      color: 'from-genz-purple-haze to-genz-lavender-dream',
    },
    {
      title: 'Karmic Connections',
      icon: <TrendingUp className="w-6 h-6" />,
      content: data?.karmic_connections,
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
            <h1 className="genz-title">Relationships 💖</h1>
          </div>
          <p className="text-xl text-white/80">
            Soul connections and compatibility analysis
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

        {data?.relationship_advice && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <GenZCard variant="gradient" className="bg-gradient-to-br from-genz-hot-pink/20 to-genz-electric-blue/20">
              <h3 className="text-2xl font-display font-bold mb-4 text-white">
                Relationship Advice
              </h3>
              <ul className="space-y-2">
                {data.relationship_advice.map((item: string, i: number) => (
                  <li key={i} className="text-white/80 flex items-start gap-2">
                    <span className="text-genz-hot-pink mt-1">💡</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </GenZCard>
          </motion.div>
        )}

        {data?.offline && wisdomCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-3xl font-display font-bold mb-6 text-white">
              7th House Wisdom
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wisdomCards.slice(0, 4).map((card, index) => (
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
