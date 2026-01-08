'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import type { Profile } from '@/lib/types';

export default function PredictionsPage() {
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
        category="predictions"
        title="Predictions"
        description="Daily, weekly, and monthly forecasts with actionable insights"
        icon={<Activity className="w-10 h-10 text-blue-400" />}
        fetchPrediction={bhriguPredictionsAPI.getPredictions}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
