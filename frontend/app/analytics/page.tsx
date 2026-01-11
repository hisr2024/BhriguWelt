'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, BarChart3, TrendingUp, Activity,
  Database, Clock, Zap, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground, { FloatingElements } from '../components/AnimatedBackground';
import GenZCard from '../components/GenZCard';
import GenZBadge from '../components/GenZBadge';
import GenZButton from '../components/GenZButton';
import BottomNav from '../components/BottomNav';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { initDB, STORES } from '@/lib/storage';

interface AnalyticsData {
  profiles: number;
  reports: number;
  wisdomCards: number;
  settings: number;
  lastUpdated: string;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
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
      loadAnalytics();
    }
  }, [encryptionKey]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const db = await initDB();

      // Count entries in each store
      const counts = await Promise.all([
        countStoreEntries(db, STORES.PROFILES),
        countStoreEntries(db, STORES.REPORTS),
        countStoreEntries(db, STORES.WISDOM_CARDS),
        countStoreEntries(db, STORES.SETTINGS),
      ]);

      setAnalytics({
        profiles: counts[0],
        reports: counts[1],
        wisdomCards: counts[2],
        settings: counts[3],
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const countStoreEntries = async (db: IDBDatabase, storeName: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const countRequest = store.count();

        countRequest.onsuccess = () => {
          resolve(countRequest.result);
        };

        countRequest.onerror = () => {
          console.error(`Error counting ${storeName}:`, countRequest.error);
          resolve(0);
        };
      } catch (error) {
        console.error(`Error accessing ${storeName}:`, error);
        resolve(0);
      }
    });
  };

  if (encryptionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-genz-electric-blue animate-spin" />
          <div className="text-white text-xl">Loading analytics...</div>
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
            <GenZButton variant="primary" onClick={loadAnalytics}>
              Retry
            </GenZButton>
          </GenZCard>
        </div>
        <BottomNav />
      </div>
    );
  }

  const stats = [
    {
      label: 'Profiles',
      value: analytics?.profiles || 0,
      icon: <Database className="w-6 h-6" />,
      color: 'from-genz-electric-blue to-genz-mint-fresh',
      description: 'Stored profiles'
    },
    {
      label: 'Reports',
      value: analytics?.reports || 0,
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'from-genz-purple-haze to-genz-lavender-dream',
      description: 'Generated reports'
    },
    {
      label: 'Wisdom Cards',
      value: analytics?.wisdomCards || 0,
      icon: <Zap className="w-6 h-6" />,
      color: 'from-genz-cyber-yellow to-genz-sunset-orange',
      description: 'Saved wisdom cards'
    },
    {
      label: 'Settings',
      value: analytics?.settings || 0,
      icon: <Activity className="w-6 h-6" />,
      color: 'from-genz-hot-pink to-genz-coral-pop',
      description: 'Configuration entries'
    },
  ];

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
            📊 Analytics
          </GenZBadge>
          <h1 className="genz-title mb-4">
            Usage Analytics
          </h1>
          <p className="text-xl text-white/80">
            Your local storage statistics
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GenZCard variant="glass" className="group hover:scale-105 transition-transform">
                <div className="flex items-start gap-4">
                  <motion.div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-genz-glow flex-shrink-0`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    {stat.icon}
                  </motion.div>
                  <div className="flex-1">
                    <div className="text-4xl font-display font-bold text-white mb-2">
                      {stat.value}
                    </div>
                    <h3 className="text-xl font-display font-semibold text-white mb-1">
                      {stat.label}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </GenZCard>
            </motion.div>
          ))}
        </div>

        <GenZCard variant="glass" className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-genz-electric-blue" />
            <h3 className="text-lg font-display font-semibold text-white">
              Last Updated
            </h3>
          </div>
          <p className="text-white/80">
            {analytics?.lastUpdated ? new Date(analytics.lastUpdated).toLocaleString() : 'N/A'}
          </p>
        </GenZCard>

        <GenZCard variant="glass" className="border-2 border-genz-electric-blue/20">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-genz-electric-blue flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-display font-semibold text-white mb-2">
                About These Analytics
              </h3>
              <p className="text-white/80 leading-relaxed">
                These statistics show data stored locally in your browser's IndexedDB.
                All data is encrypted and never leaves your device unless you explicitly
                request a backup or sync operation.
              </p>
            </div>
          </div>
        </GenZCard>
      </div>

      <BottomNav />
    </div>
  );
}
