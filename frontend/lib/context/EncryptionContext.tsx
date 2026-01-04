'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  initDB,
  getEncryptionKey,
  isEncryptionSetup,
  setupEncryption,
  setItem,
  STORES,
} from '../storage';
import { hashPasscode } from '../crypto';

interface EncryptionContextType {
  encryptionKey: CryptoKey | null;
  isSetup: boolean;
  isLoading: boolean;
  isUnlocked: boolean;
  unlockWithPasscode: (passcode: string) => Promise<boolean>;
  setupPasscode: (passcode: string) => Promise<boolean>;
  lock: () => void;
  lastActivity: number;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export function EncryptionProvider({ 
  children, 
  autoLockTimeoutMinutes = 5 
}: { 
  children: ReactNode; 
  autoLockTimeoutMinutes?: number;
}) {
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [isSetup, setIsSetup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    try {
      await initDB();
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
    if (typeof window === 'undefined') return;
    
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

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
    }, 10000);

    return () => clearInterval(checkLockTimeout);
  }, [encryptionKey, lastActivity, autoLockTimeoutMinutes]);

  const unlockWithPasscode = async (passcode: string): Promise<boolean> => {
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

  const setupPasscode = async (passcode: string): Promise<boolean> => {
    try {
      // Setup encryption with the passcode
      await setupEncryption(passcode);

      // Store passcode hash for verification
      const hash = await hashPasscode(passcode);
      await setItem(STORES.METADATA, 'passcodeHash', { value: hash });

      // Mark setup as complete
      await setItem(STORES.METADATA, 'setupComplete', { value: true });

      // Get the encryption key and store it in state
      const key = await getEncryptionKey(passcode);
      setEncryptionKey(key);
      setIsSetup(true);
      setLastActivity(Date.now());
      
      return true;
    } catch (error) {
      console.error('Error setting up passcode:', error);
      return false;
    }
  };

  const lock = useCallback(() => {
    setEncryptionKey(null);
  }, []);

  return (
    <EncryptionContext.Provider
      value={{
        encryptionKey,
        isSetup,
        isLoading,
        isUnlocked: !!encryptionKey,
        unlockWithPasscode,
        setupPasscode,
        lock,
        lastActivity,
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
}
