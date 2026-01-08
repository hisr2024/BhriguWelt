'use client';

import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import type { Profile } from '@/lib/types';

export default function KarmicRemediesPage() {
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
    <PredictionErrorBoundary context="karmic-remedies">
      <BhriguPredictionView
        category="karmic-remedies"
        title="Karmic Remedies"
        description="Personalized spiritual practices and remedies for balance"
        icon={<Sparkles className="w-10 h-10 text-pink-400" />}
        fetchPrediction={bhriguPredictionsAPI.getKarmicRemedies}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
