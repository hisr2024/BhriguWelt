'use client';

import { useRouter } from 'next/navigation';
import PasscodeSetup from '../components/PasscodeSetup';
import AnimatedBackground from '../components/AnimatedBackground';

export default function SetupPasscodePage() {
  const router = useRouter();

  const handleComplete = () => {
    // Redirect to get-started page after successful setup
    router.push('/get-started');
  };

  return (
    <>
      <AnimatedBackground />
      <PasscodeSetup onComplete={handleComplete} />
    </>
  );
}
