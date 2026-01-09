'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import { useI18n } from '@/lib/context/I18nContext';
import type { Profile } from '@/lib/types';

export default function LifeEventsPage() {
  const { t } = useI18n();
  const { getAllProfiles } = useEncryptedStorage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profiles = await getAllProfiles();
      if (profiles.length > 0) {
        setProfile(profiles[0]);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setProfileReady(true);
    }
  };

  if (!profileReady) {
    return <PredictionViewSkeleton />;
  }

  return (
    <PredictionErrorBoundary context="life-events">
      <BhriguPredictionView
        category="life-events"
        title={t('bhriguPages.lifeEvents.title')}
        description={t('bhriguPages.lifeEvents.description')}
        icon={<Calendar className="w-10 h-10 text-green-400" />}
        fetchPrediction={bhriguPredictionsAPI.getLifeEvents}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
