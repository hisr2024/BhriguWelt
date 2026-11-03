/**
 * Session management for secure app state
 * Manages encryption key lifecycle and security context
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  setupEncryption,
  getEncryptionKey,
  verifyEncryptionKey,
  isEncryptionSetup,
  markKeyRotationRequired,
  isKeyRotationRequired,
  rotateEncryptionKey,
  clearKeyRotationRequired,
} from '../storage';
import { useAutoLock, useLockOnBackground } from './useAutoLock';

interface SessionContextType {
  // Auth state
  isSetup: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  encryptionKey: CryptoKey | null;
  
  // Actions
  setup: (passcode: string) => Promise<boolean>;
  unlock: (passcode: string) => Promise<boolean>;
  lock: () => void;
  
  // Settings
  autoLockEnabled: boolean;
  autoLockTimeout: number;
  lockOnBackground: boolean;
  setAutoLockEnabled: (enabled: boolean) => void;
  setAutoLockTimeout: (seconds: number) => void;
  setLockOnBackground: (enabled: boolean) => void;
  
  // Stats
  failedAttempts: number;
  lastActivity: number;
}

const SessionContext = createContext<SessionContextType | null>(null);

interface SessionProviderProps {
  children: ReactNode;
  defaultTimeout?: number;
}

export function SessionProvider({ children, defaultTimeout = 300 }: SessionProviderProps) {
  // Auth state
  const [isSetup, setIsSetup] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  
  // Security settings
  const [autoLockEnabled, setAutoLockEnabled] = useState(true);
  const [autoLockTimeout, setAutoLockTimeout] = useState(defaultTimeout);
  const [lockOnBackground, setLockOnBackground] = useState(true);
  
  // Security metrics
  const [failedAttempts, setFailedAttempts] = useState(0);
  
  // Check if encryption is setup on mount
  useEffect(() => {
    checkSetup();
  }, []);
  
  const checkSetup = async () => {
    try {
      setIsLoading(true);
      const setup = await isEncryptionSetup();
      setIsSetup(setup);
    } catch (error) {
      console.error('Error checking encryption setup:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Setup encryption with passcode
  const setup = async (passcode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await setupEncryption(passcode);
      const key = await getEncryptionKey(passcode);
      
      setEncryptionKey(key);
      setIsSetup(true);
      setIsUnlocked(true);
      setFailedAttempts(0);
      
      return true;
    } catch (error) {
      console.error('Error setting up encryption:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Unlock with passcode
  const unlock = async (passcode: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Verify passcode
      const isValid = await verifyEncryptionKey(passcode);
      
      if (!isValid) {
        setFailedAttempts((prev) => prev + 1);
        return false;
      }
      
      // Get encryption key
      const key = await getEncryptionKey(passcode);
      let activeKey = key;
      if (await isKeyRotationRequired()) {
        activeKey = await rotateEncryptionKey(passcode, key);
        await clearKeyRotationRequired();
      }
      
      setEncryptionKey(activeKey);
      setIsUnlocked(true);
      setFailedAttempts(0);
      
      return true;
    } catch (error) {
      console.error('Error unlocking:', error);
      setFailedAttempts((prev) => prev + 1);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Lock the app
  const lock = useCallback(() => {
    markKeyRotationRequired().catch((error) => {
      console.error('Error marking key rotation:', error);
    });
    setEncryptionKey(null);
    setIsUnlocked(false);
    
    // Log lock event (no sensitive data)
    console.log('[Security] App locked');
  }, []);
  
  // Auto-lock functionality
  const { lastActivity } = useAutoLock({
    enabled: autoLockEnabled && isUnlocked,
    timeoutSeconds: autoLockTimeout,
    onLock: lock,
  });
  
  // Lock on background
  useLockOnBackground(lock, lockOnBackground && isUnlocked);
  
  // Load settings from localStorage
  useEffect(() => {
    try {
      const settings = localStorage.getItem('security_settings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setAutoLockEnabled(parsed.autoLockEnabled ?? true);
        setAutoLockTimeout(parsed.autoLockTimeout ?? defaultTimeout);
        setLockOnBackground(parsed.lockOnBackground ?? true);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  }, [defaultTimeout]);
  
  // Save settings to localStorage
  useEffect(() => {
    try {
      const settings = {
        autoLockEnabled,
        autoLockTimeout,
        lockOnBackground,
      };
      localStorage.setItem('security_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving security settings:', error);
    }
  }, [autoLockEnabled, autoLockTimeout, lockOnBackground]);
  
  // Reset failed attempts after 10 minutes
  useEffect(() => {
    if (failedAttempts > 0) {
      const timeout = setTimeout(() => {
        setFailedAttempts(0);
      }, 600000); // 10 minutes
      
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [failedAttempts]);
  
  const value: SessionContextType = {
    // Auth state
    isSetup,
    isUnlocked,
    isLoading,
    encryptionKey,
    
    // Actions
    setup,
    unlock,
    lock,
    
    // Settings
    autoLockEnabled,
    autoLockTimeout,
    lockOnBackground,
    setAutoLockEnabled,
    setAutoLockTimeout,
    setLockOnBackground,
    
    // Stats
    failedAttempts,
    lastActivity,
  };
  
  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

/**
 * Hook to use session context
 */
export function useSession() {
  const context = useContext(SessionContext);
  
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  
  return context;
}

/**
 * Hook to require authentication
 * Redirects to unlock screen if not authenticated
 */
export function useRequireAuth() {
  const { isUnlocked, isLoading } = useSession();
  
  return {
    isAuthenticated: isUnlocked,
    isLoading,
  };
}

/**
 * Component to protect routes requiring authentication
 */
interface ProtectedProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function Protected({ children, fallback }: ProtectedProps) {
  const { isUnlocked, isLoading } = useSession();
  
  if (isLoading) {
    return fallback || <div>Loading...</div>;
  }
  
  if (!isUnlocked) {
    return fallback || <div>Please unlock to continue</div>;
  }
  
  return <>{children}</>;
}
