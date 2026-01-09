'use client';

import { ReactNode } from 'react';
import { EncryptionProvider } from '@/lib/context/EncryptionContext';
import { I18nProvider } from '@/lib/context/I18nContext';
import ContrastModeProvider from './components/ContrastModeProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <EncryptionProvider autoLockTimeoutMinutes={15}>
        <ContrastModeProvider />
        {children}
      </EncryptionProvider>
    </I18nProvider>
  );
}
