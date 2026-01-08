'use client';

import { ReactNode } from 'react';
import { EncryptionProvider } from '@/lib/context/EncryptionContext';
import ContrastModeProvider from './components/ContrastModeProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <EncryptionProvider autoLockTimeoutMinutes={15}>
      <ContrastModeProvider />
      {children}
    </EncryptionProvider>
  );
}
