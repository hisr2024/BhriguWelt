'use client';

import { useState, useEffect } from 'react';
import { Sun } from 'lucide-react';
import BhriguPredictionView from '@/app/components/BhriguPredictionView';
import { bhriguPredictionsAPI } from '@/lib/api';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import type { Profile } from '@/lib/types';

export default function PresentLifePage() {
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
    <BhriguPredictionView
      category="present-life"
      title="Present Life"
      description="Comprehensive analysis of your current life path and opportunities"
      icon={<Sun className="w-10 h-10 text-yellow-400" />}
      fetchPrediction={bhriguPredictionsAPI.getPresentLife}
      profile={profile}
    />
  );
}
