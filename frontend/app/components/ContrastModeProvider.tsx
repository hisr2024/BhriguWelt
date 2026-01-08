'use client';

import { useEffect } from 'react';
import { applyHighContrast, loadHighContrastSetting } from '@/lib/accessibility';

export default function ContrastModeProvider() {
  useEffect(() => {
    const applyStoredPreference = () => {
      applyHighContrast(loadHighContrastSetting());
    };

    applyStoredPreference();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'app_settings') {
        applyStoredPreference();
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return null;
}
