'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import { PredictionViewSkeleton } from '@/app/components/LoadingStates';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import type { Profile } from '@/lib/types';

export default function RelationshipsPage() {
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
    <BhriguPredictionView
      category="relationships"
      title="Relationships"
      description="Soul connections and compatibility analysis for deeper bonds"
      icon={<Heart className="w-10 h-10 text-red-400" />}
      fetchPrediction={bhriguPredictionsAPI.getRelationships}
      profile={profile}
    />
  );
}
