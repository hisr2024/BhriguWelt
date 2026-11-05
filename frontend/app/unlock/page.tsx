'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { safeNext } from '@/lib/unlockRedirect';
import PasscodeUnlock from '../components/PasscodeUnlock';
import AnimatedBackground from '../components/AnimatedBackground';
import { useEncryption } from '@/lib/context/EncryptionContext';

export default function UnlockPage() {
  const router = useRouter();
  const { unlockWithPasscode, isSetup, isLoading, isUnlocked } = useEncryption();
  const nextPath = () =>
    safeNext(typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('next'));

  // Redirect to setup if not set up
  useEffect(() => {
    if (!isLoading && !isSetup) {
      router.push('/setup-passcode');
    }
  }, [isLoading, isSetup, router]);

  // Redirect to dashboard if already unlocked
  useEffect(() => {
    if (!isLoading && isSetup && isUnlocked) {
      router.replace(nextPath());
    }
  }, [isLoading, isSetup, isUnlocked, router]);

  const handleUnlock = async (passcode: string): Promise<boolean> => {
    try {
      // Use the context's unlockWithPasscode to derive and store the key
      const success = await unlockWithPasscode(passcode);
      
      if (success) {
        router.replace(nextPath());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during unlock:', error);
      return false;
    }
  };

  if (isLoading) {
    return (
      <>
        <AnimatedBackground />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <PasscodeUnlock onUnlock={handleUnlock} />
    </>
  );
}
