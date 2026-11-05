'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEncryption } from '@/lib/context/EncryptionContext';
import { useEncryptedStorage } from '@/lib/hooks/useEncryptedStorage';
import { getCurrentProfileId } from '@/lib/profileHelpers';
import type { Profile } from '@/lib/types';

/**
 * The profile a reading is for: the one chosen on the readings hub
 * (current profile id), else the first saved profile.
 * A locked or un-set-up vault redirects to unlock / passcode setup instead of
 * pretending there is no profile.
 */
export function useActiveProfile() {
  const router = useRouter();
  const { isSetup, isUnlocked, isLoading } = useEncryption();
  const { getAllProfiles } = useEncryptedStorage();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isSetup) {
      router.push('/setup-passcode');
      return;
    }
    if (!isUnlocked) {
      router.push('/unlock');
      return;
    }
    let cancelled = false;
    getAllProfiles()
      .then((profiles) => {
        if (cancelled) return;
        const currentId = getCurrentProfileId();
        const chosen = profiles.find((p) => String(p.id) === String(currentId)) ?? profiles[0] ?? null;
        setProfile(chosen);
      })
      .catch((error) => console.error('Error loading profile:', error))
      .finally(() => {
        if (!cancelled) setProfileReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isSetup, isUnlocked, getAllProfiles, router]);

  return { profile, profileReady };
}
