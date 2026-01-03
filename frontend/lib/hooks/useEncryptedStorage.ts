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

/**
 * Hook for managing the encryption key in session
 */
export function useEncryptionKey() {
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isSetup, setIsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      const setup = await isEncryptionSetup();
      setIsSetup(setup);
    } catch (error) {
      console.error('Error checking encryption setup:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unlockWithPasscode = async (passcode: string) => {
    try {
      const key = await getEncryptionKey(passcode);
      setEncryptionKey(key);
      return true;
    } catch (error) {
      console.error('Error unlocking with passcode:', error);
      return false;
    }
  };

  const lock = () => {
    setEncryptionKey(null);
  };

  return {
    encryptionKey,
    isSetup,
    isLoading,
    isUnlocked: !!encryptionKey,
    unlockWithPasscode,
    lock,
  };
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

      await setItem(STORES.PROFILES, id, updated, encryptionKey);
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
