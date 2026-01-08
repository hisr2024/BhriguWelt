'use client';

import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import type { Profile } from '@/lib/types';

export default function PastLivesPage() {
  const { getAllProfiles } = useEncryptedStorage();
  const [profile, setProfile] = useState<Profile | null>(null);

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
    }
  };

  return (
    <PredictionErrorBoundary>
      <BhriguPredictionView
        category="past-lives"
        title="Past Lives"
        description="Explore your previous incarnations and karmic patterns across lifetimes"
        icon={<History className="w-10 h-10 text-purple-400" />}
        fetchPrediction={bhriguPredictionsAPI.getPastLives}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
