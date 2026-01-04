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
      const key = await getEncryptionKey(passcode);
      
      if (key) {
        // Successfully unlocked - redirect to dashboard
        router.push('/dashboard');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during unlock:', error);
      return false;
    }
  };

  const handleForgotPasscode = () => {
    // In a real app, this might guide users through account recovery
    // For now, just show an alert
    alert('If you forgot your passcode, you may need to clear app data and start fresh. All encrypted data will be lost.');
  };

  return (
    <>
      <AnimatedBackground />
      <PasscodeUnlock 
        onUnlock={handleUnlock}
        onForgotPasscode={handleForgotPasscode}
      />
    </>
  );
}
