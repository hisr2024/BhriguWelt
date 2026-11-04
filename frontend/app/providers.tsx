'use client';

import { ReactNode, useCallback } from 'react';
import { EncryptionProvider } from '@/lib/context/EncryptionContext';
import { I18nProvider } from '@/lib/context/I18nContext';
import ContrastModeProvider from './components/ContrastModeProvider';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

export function Providers({ children }: { children: ReactNode }) {
  const handleOnlineChange = useCallback((isOnline: boolean) => {
    if (isOnline) {
      // Loaded on demand so axios is not in every page's initial bundle.
      import('@/lib/api').then(({ processOfflineQueue }) => processOfflineQueue()).catch(() => undefined);
    }
  }, []);

  useOnlineStatus(handleOnlineChange);

  return (
    <I18nProvider>
      <EncryptionProvider autoLockTimeoutMinutes={15}>
        <ContrastModeProvider />
        {children}
      </EncryptionProvider>
    </I18nProvider>
  );
}
