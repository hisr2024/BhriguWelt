'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PasscodeSetup from '../components/PasscodeSetup';
import AnimatedBackground from '../components/AnimatedBackground';
import { useEncryption } from '@/lib/context/EncryptionContext';

export default function SetupPasscodePage() {
  const router = useRouter();
  const { isSetup, isLoading, isUnlocked } = useEncryption();

  // If already set up and unlocked, go to dashboard
  useEffect(() => {
    if (!isLoading && isSetup && isUnlocked) {
      router.push('/dashboard');
    }
  }, [isLoading, isSetup, isUnlocked, router]);

  // If already set up but not unlocked, go to unlock
  useEffect(() => {
    if (!isLoading && isSetup && !isUnlocked) {
      router.push('/unlock');
    }
  }, [isLoading, isSetup, isUnlocked, router]);

  const handleComplete = () => {
    router.push('/get-started');
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
      <PasscodeSetup onComplete={handleComplete} />
    </>
  );
}
