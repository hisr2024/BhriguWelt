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
 * Hook for managing the encryption key in session with auto-lock
 */
export function useEncryptionKey(autoLockTimeoutMinutes: number = 5) {
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isSetup, setIsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

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

  // Track user activity for auto-lock
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    // Listen to user interactions
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  // Auto-lock timer
  useEffect(() => {
    if (!encryptionKey || autoLockTimeoutMinutes <= 0) return;

    const checkLockTimeout = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      const timeoutMs = autoLockTimeoutMinutes * 60 * 1000;

      if (inactiveTime >= timeoutMs) {
        console.log('Auto-locking due to inactivity');
        setEncryptionKey(null);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkLockTimeout);
  }, [encryptionKey, lastActivity, autoLockTimeoutMinutes]);

  const unlockWithPasscode = async (passcode: string) => {
    try {
      const key = await getEncryptionKey(passcode);
      setEncryptionKey(key);
      setLastActivity(Date.now());
      return true;
    } catch (error) {
      console.error('Error unlocking with passcode:', error);
      return false;
    }
  };

  const lock = useCallback(() => {
    setEncryptionKey(null);
  }, []);

  return {
    encryptionKey,
    isSetup,
    isLoading,
    isUnlocked: !!encryptionKey,
    unlockWithPasscode,
    lock,
    lastActivity,
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
