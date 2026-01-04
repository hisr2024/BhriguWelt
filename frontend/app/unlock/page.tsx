'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PasscodeUnlock from '../components/PasscodeUnlock';
import AnimatedBackground from '../components/AnimatedBackground';
import { useEncryptionKey } from '@/lib/hooks/useEncryptedStorage';

export default function UnlockPage() {
  const router = useRouter();
  const { unlockWithPasscode, isSetup, isLoading } = useEncryptionKey();

  // Redirect to setup if not set up
  useEffect(() => {
    if (!isLoading && !isSetup) {
      router.push('/setup-passcode');
    }
  }, [isLoading, isSetup, router]);

  const handleUnlock = async (passcode: string): Promise<boolean> => {
    try {
      // THIS IS THE CRITICAL FIX - actually unlock with the passcode
      const success = await unlockWithPasscode(passcode);
      
      if (success) {
        router.push('/dashboard');
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
