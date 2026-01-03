"use client";

import { useState, useEffect } from 'react';
import { getAIPreferences, updateAIMode, revokeAIConsent } from '@/lib/ai-preferences';
import AIConsentDialog from './AIConsentDialog';

interface AIModeInfo {
  mode: 'offline' | 'hybrid' | 'conversational';
  name: string;
  description: string;
  icon: string;
  color: string;
}

const AI_MODES: AIModeInfo[] = [
  {
    mode: 'offline',
    name: 'Offline Only',
    description: '100% local processing, maximum privacy',
    icon: '🔒',
    color: 'green'
  },
  {
    mode: 'hybrid',
    name: 'Hybrid Refine',
    description: 'AI enhances local calculations',
    icon: '⚖️',
    color: 'blue'
  },
  {
    mode: 'conversational',
    name: 'AI Chatbot',
    description: 'Interactive AI assistant',
    icon: '🤖',
    color: 'purple'
  }
];

export default function AIModeSelector() {
  const [currentMode, setCurrentMode] = useState<'offline' | 'hybrid' | 'conversational'>('offline');
  const [consentGranted, setConsentGranted] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [requestedMode, setRequestedMode] = useState<'hybrid' | 'conversational'>('hybrid');

  useEffect(() => {
    // Load preferences on mount
    const prefs = getAIPreferences();
    setCurrentMode(prefs.mode);
    setConsentGranted(prefs.consentGranted);
  }, []);

  const handleModeSelect = (mode: 'offline' | 'hybrid' | 'conversational') => {
    // If selecting offline, just switch directly
    if (mode === 'offline') {
      revokeAIConsent();
      setCurrentMode('offline');
      setConsentGranted(false);
      return;
    }

    // If consent not granted, show consent dialog
    if (!consentGranted) {
      setRequestedMode(mode);
      setShowConsentDialog(true);
      return;
    }

    // If consent already granted, just switch mode
    try {
      updateAIMode(mode);
      setCurrentMode(mode);
    } catch (error) {
      console.error('Error updating AI mode:', error);
    }
  };

  const handleConsent = (mode: 'hybrid' | 'conversational') => {
    setCurrentMode(mode);
    setConsentGranted(true);
    setShowConsentDialog(false);
  };

  const getColorClasses = (modeColor: string, isActive: boolean) => {
    const colors = {
      green: isActive
        ? 'bg-green-100 dark:bg-green-900/30 border-green-500 text-green-900 dark:text-green-100'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-green-300 dark:hover:border-green-700',
      blue: isActive
        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-900 dark:text-blue-100'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700',
      purple: isActive
        ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-900 dark:text-purple-100'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-700'
    };
    return colors[modeColor as keyof typeof colors] || colors.green;
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Mode
          </h3>
          {consentGranted && (
            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full">
              Consent Granted
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AI_MODES.map((modeInfo) => {
            const isActive = currentMode === modeInfo.mode;
            const needsConsent = modeInfo.mode !== 'offline' && !consentGranted;

            return (
              <button
                key={modeInfo.mode}
                onClick={() => handleModeSelect(modeInfo.mode)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all
                  ${getColorClasses(modeInfo.color, isActive)}
                  ${needsConsent ? 'opacity-75' : ''}
                `}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <span className="flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="text-4xl mb-2">{modeInfo.icon}</div>

                {/* Name */}
                <h4 className="font-semibold mb-1">{modeInfo.name}</h4>

                {/* Description */}
                <p className="text-sm opacity-80">{modeInfo.description}</p>

                {/* Consent Required Badge */}
                {needsConsent && (
                  <div className="mt-3">
                    <span className="inline-block text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
                      Consent Required
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Privacy Notice */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Current Mode:</strong> {AI_MODES.find(m => m.mode === currentMode)?.name}
          </p>
          {currentMode === 'offline' ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              ✓ All processing happens locally on your device. No data is transmitted.
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              ⚠️ This mode sends astrological data (no personal info) to our AI backend.
            </p>
          )}
        </div>
      </div>

      {/* Consent Dialog */}
      <AIConsentDialog
        isOpen={showConsentDialog}
        onClose={() => setShowConsentDialog(false)}
        onConsent={handleConsent}
        requestedMode={requestedMode}
      />
    </>
  );
}
