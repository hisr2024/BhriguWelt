'use client';

import { ReactNode } from 'react';
import { EncryptionProvider } from '@/lib/context/EncryptionContext';
import { ToastProvider } from '@/lib/context/ToastContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <EncryptionProvider autoLockTimeoutMinutes={15}>
      <ToastProvider>{children}</ToastProvider>
    </EncryptionProvider>
  );
}
