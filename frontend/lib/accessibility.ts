export const loadHighContrastSetting = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const stored = localStorage.getItem('app_settings');
  if (!stored) {
    return false;
  }

  try {
    const parsed = JSON.parse(stored);
    return Boolean(parsed?.highContrast);
  } catch (error) {
    console.error('Error parsing accessibility settings:', error);
    return false;
  }
};

export const applyHighContrast = (enabled: boolean): void => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  if (enabled) {
    root.setAttribute('data-contrast', 'high');
  } else {
    root.removeAttribute('data-contrast');
  }
};
