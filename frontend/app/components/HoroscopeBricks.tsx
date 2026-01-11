'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun, Star, Zap, Loader2 } from 'lucide-react';
import GenZCard from './GenZCard';
import { bhriguPredictionsAPI, type BirthDetails } from '@/lib/api';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { loadCurrentProfile } from '@/lib/profileHelpers';

const BRICKS = [
  { scope: 'today', label: 'Today', icon: <Sun className="w-6 h-6" />, color: 'from-genz-cyber-yellow to-genz-sunset-orange' },
  { scope: 'week', label: 'This Week', icon: <Moon className="w-6 h-6" />, color: 'from-genz-purple-haze to-genz-lavender-dream' },
  { scope: 'month', label: 'This Month', icon: <Star className="w-6 h-6" />, color: 'from-genz-electric-blue to-genz-mint-fresh' },
  { scope: 'year', label: 'This Year', icon: <Zap className="w-6 h-6" />, color: 'from-genz-hot-pink to-genz-coral-pop' },
];

export default function HoroscopeBricks() {
  const router = useRouter();
  const { encryptionKey } = useEncryption();
  const [loadingScope, setLoadingScope] = useState<Record<string, boolean>>({});
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleClick = async (scope: string) => {
    setLoadingScope((prev) => ({ ...prev, [scope]: true }));
    router.push(`/horoscope/${scope}`);

    try {
      if (!encryptionKey) {
        console.warn('Horoscope generation skipped: encryption key unavailable.');
        return;
      }

      const profile = await loadCurrentProfile(encryptionKey);
      if (!profile) {
        console.warn('Horoscope generation skipped: profile missing.');
        return;
      }

      const birthData: BirthDetails = {
        date_of_birth: profile.dateOfBirth,
        time_of_birth: profile.timeOfBirth,
        place_of_birth: profile.placeOfBirth,
        latitude: profile.latitude,
        longitude: profile.longitude,
      };

      await bhriguPredictionsAPI.getPredictions(birthData);
    } catch (error) {
      console.warn('Background horoscope generation failed, will rely on cached/offline data.', error);
    } finally {
      if (isMounted.current) {
        setLoadingScope((prev) => ({ ...prev, [scope]: false }));
      }
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {BRICKS.map((brick) => (
        <GenZCard key={brick.scope} variant="glass" className="p-0">
          <button
            type="button"
            onClick={() => handleClick(brick.scope)}
            aria-label={`Open ${brick.label} horoscope`}
            className="w-full text-left p-6 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-genz-electric-blue"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${brick.color} flex items-center justify-center shadow-genz-glow`}>
                {brick.icon}
              </div>
              {loadingScope[brick.scope] && <Loader2 className="w-5 h-5 text-white/80 animate-spin" />}
            </div>
            <h3 className="text-lg font-display font-bold text-white mb-2">{brick.label}</h3>
            <p className="text-white/70 text-sm">Tap to reveal your {brick.label.toLowerCase()} guidance.</p>
          </button>
        </GenZCard>
      ))}
    </div>
  );
}
