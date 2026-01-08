'use client';

import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import type { Profile } from '@/lib/types';

export default function KarmicJourneyPage() {
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
    <PredictionErrorBoundary>
      <BhriguPredictionView
        category="karmic-journey"
        title="Karmic Journey"
        description="Discover your soul's purpose and life mission through detailed karmic analysis"
        icon={<Target className="w-10 h-10 text-cyan-400" />}
        fetchPrediction={bhriguPredictionsAPI.getKarmicJourney}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
