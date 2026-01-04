/**
 * React hooks for encrypted storage
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  initDB,
  getItem,
  setItem,
  getAllItems,
  deleteItem,
  getEncryptionKey,
  isEncryptionSetup,
  STORES,
} from '../storage';
import type { Profile, Report, WisdomCard, AppSettings } from '../types';
import { useEncryptionContext } from '../context/EncryptionContext';

/**
 * Hook for managing the encryption key in session with auto-lock
 */
export function useEncryptionKey(autoLockTimeoutMinutes: number = 5) {
  // Use the context instead of local state
  return useEncryptionContext();
}

/**
 * Hook for managing profiles
 */
export function useProfiles(encryptionKey: CryptoKey | null) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    if (!encryptionKey) {
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      await initDB();
      const items = await getAllItems(STORES.PROFILES, encryptionKey);
      setProfiles(items);
      setError(null);
    } catch (err) {
      setError('Failed to load profiles');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [encryptionKey]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const addProfile = async (profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!encryptionKey) return;

    try {
      const newProfile: Profile = {
        ...profile,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setItem(STORES.PROFILES, `profile_${Date.now()}`, newProfile, encryptionKey);
      await loadProfiles();
    } catch (err) {
      setError('Failed to add profile');
      console.error(err);
    }
  };

  const updateProfile = async (id: number, updates: Partial<Profile>) => {
    if (!encryptionKey) return;

    try {
      const existing = await getItem(STORES.PROFILES, id, encryptionKey);
      if (!existing) throw new Error('Profile not found');

      const updated = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await setItem(STORES.PROFILES, id.toString(), updated, encryptionKey);
      await loadProfiles();
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    }
  };

  const deleteProfile = async (id: number) => {
    try {
      await deleteItem(STORES.PROFILES, id);
      await loadProfiles();
    } catch (err) {
      setError('Failed to delete profile');
      console.error(err);
    }
  };

  return {
    profiles,
    isLoading,
    error,
    addProfile,
    updateProfile,
    deleteProfile,
    reload: loadProfiles,
  };
}
