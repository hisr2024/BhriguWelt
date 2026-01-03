/**
 * AI Preferences Management
 * Handles AI mode selection and consent tracking
 */

export interface AIPreferences {
  mode: 'offline' | 'hybrid' | 'conversational';
  consentGranted: boolean;
  consentTimestamp: string | null;
  privacyAcknowledged: boolean;
}

const AI_PREFERENCES_KEY = 'bhriguwelt_ai_preferences';

const defaultPreferences: AIPreferences = {
  mode: 'offline',
  consentGranted: false,
  consentTimestamp: null,
  privacyAcknowledged: false,
};

/**
 * Get current AI preferences from localStorage
 */
export function getAIPreferences(): AIPreferences {
  if (typeof window === 'undefined') {
    return defaultPreferences;
  }
  
  try {
    const stored = localStorage.getItem(AI_PREFERENCES_KEY);
    if (!stored) {
      return defaultPreferences;
    }
    
    const parsed = JSON.parse(stored);
    return { ...defaultPreferences, ...parsed };
  } catch (error) {
    console.error('Error loading AI preferences:', error);
    return defaultPreferences;
  }
}

/**
 * Save AI preferences to localStorage
 */
export function saveAIPreferences(preferences: AIPreferences): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(AI_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving AI preferences:', error);
  }
}

/**
 * Grant AI consent and update preferences
 */
export function grantAIConsent(mode: 'hybrid' | 'conversational'): AIPreferences {
  const preferences: AIPreferences = {
    mode,
    consentGranted: true,
    consentTimestamp: new Date().toISOString(),
    privacyAcknowledged: true,
  };
  
  saveAIPreferences(preferences);
  return preferences;
}

/**
 * Revoke AI consent and return to offline mode
 */
export function revokeAIConsent(): AIPreferences {
  const preferences: AIPreferences = {
    mode: 'offline',
    consentGranted: false,
    consentTimestamp: null,
    privacyAcknowledged: false,
  };
  
  saveAIPreferences(preferences);
  return preferences;
}

/**
 * Check if AI features are available (consent granted)
 */
export function isAIEnabled(): boolean {
  const prefs = getAIPreferences();
  return prefs.consentGranted && prefs.mode !== 'offline';
}

/**
 * Get AI mode for API requests
 */
export function getAIMode(): { mode: string; consent: boolean } {
  const prefs = getAIPreferences();
  return {
    mode: prefs.mode,
    consent: prefs.consentGranted,
  };
}

/**
 * Update AI mode (consent must already be granted)
 */
export function updateAIMode(mode: 'offline' | 'hybrid' | 'conversational'): AIPreferences {
  const current = getAIPreferences();
  
  // If switching to offline, revoke consent
  if (mode === 'offline') {
    return revokeAIConsent();
  }
  
  // If consent not granted, cannot switch to AI modes
  if (!current.consentGranted) {
    throw new Error('Consent must be granted before enabling AI features');
  }
  
  const updated: AIPreferences = {
    ...current,
    mode,
  };
  
  saveAIPreferences(updated);
  return updated;
}
