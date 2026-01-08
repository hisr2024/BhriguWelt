'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import PredictionErrorBoundary from '@/app/components/PredictionErrorBoundary';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import type { Profile } from '@/lib/types';

export default function LifeEventsPage() {
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
    <PredictionErrorBoundary context="life-events">
      <BhriguPredictionView
        category="life-events"
        title="Life Events"
        description="Predict major life transitions with precision timing"
        icon={<Calendar className="w-10 h-10 text-green-400" />}
        fetchPrediction={bhriguPredictionsAPI.getLifeEvents}
        profile={profile}
      />
    </PredictionErrorBoundary>
  );
}
