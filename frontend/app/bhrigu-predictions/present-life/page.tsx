'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sun } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import { useI18n } from '@/lib/context/I18nContext';
import type { Profile } from '@/lib/types';

export default function PresentLifePage() {
  const { t } = useI18n();
  const { getAllProfiles } = useEncryptedStorage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const profiles = await getAllProfiles();
      if (profiles.length > 0) {
        setProfile(profiles[0] ?? null);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setProfileReady(true);
    }
  }, [getAllProfiles]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (!profileReady) {
    return <PredictionViewSkeleton />;
  }

  return (
    <PredictionErrorBoundary context="present-life">
      <BhriguPredictionView
        category="present-life"
        title={t('bhriguPages.presentLife.title')}
        description={t('bhriguPages.presentLife.description')}
        icon={<Sun className="w-10 h-10 text-yellow-400" />}
        fetchPrediction={bhriguPredictionsAPI.getPresentLife}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
