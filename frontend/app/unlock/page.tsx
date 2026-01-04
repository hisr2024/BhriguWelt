'use client';

import { useRouter } from 'next/navigation';
import PasscodeUnlock from '../components/PasscodeUnlock';
import AnimatedBackground from '../components/AnimatedBackground';
import { getEncryptionKey } from '@/lib/storage';

export default function UnlockPage() {
  const router = useRouter();

  const handleUnlock = async (passcode: string): Promise<boolean> => {
    try {
      // Verify the passcode and get encryption key
      // This will throw an error if passcode is invalid
      await getEncryptionKey(passcode);
      
      // Successfully unlocked - redirect to dashboard
      router.push('/dashboard');
      return true;
    } catch (error) {
      console.error('Error during unlock:', error);
      return false;
    }
  };

  return (
    <>
      <AnimatedBackground />
      <PasscodeUnlock 
        onUnlock={handleUnlock}
      />
    </>
  );
}
