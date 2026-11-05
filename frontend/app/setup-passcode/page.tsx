'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import PasscodeSetup from '../components/PasscodeSetup';
import { useEncryption } from '@/lib/context/EncryptionContext';

export default function SetupPasscodePage() {
  const router = useRouter();
  const { isSetup, isLoading, isUnlocked } = useEncryption();

  // Decide once, on arrival: a passcode that already exists sends you on.
  // Creating one here must not trigger this (it used to win the race against
  // handleComplete and skip profile creation).
  const decided = useRef(false);
  useEffect(() => {
    if (isLoading || decided.current) return;
    decided.current = true;
    if (isSetup) router.push(isUnlocked ? '/dashboard' : '/unlock');
  }, [isLoading, isSetup, isUnlocked, router]);

  const handleComplete = () => {
    router.push('/get-started');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="loading-spinner" role="status" aria-label="Loading" />
      </div>
    );
  }

  return (
    <PasscodeSetup onComplete={handleComplete} />
  );
}
