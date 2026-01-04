'use client';

import { useRouter } from 'next/navigation';
import PasscodeUnlock from '../components/PasscodeUnlock';
import AnimatedBackground from '../components/AnimatedBackground';

export default function UnlockPage() {
  const router = useRouter();

  const handleUnlock = async (passcode: string): Promise<boolean> => {
    try {
      // PasscodeUnlock component has already verified the passcode at this point
      // We just need to acknowledge success and redirect
      router.push('/dashboard');
      return true;
    } catch (error) {
      console.error('Error during unlock redirect:', error);
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
