"use client";

import { useState, useEffect } from 'react';
import { grantAIConsent, revokeAIConsent, getAIPreferences } from '@/lib/ai-preferences';
import { aiAPI } from '@/lib/api';

interface AIConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConsent: (mode: 'hybrid' | 'conversational') => void;
  requestedMode: 'hybrid' | 'conversational';
}

export default function AIConsentDialog({
  isOpen,
  onClose,
  onConsent,
  requestedMode
}: AIConsentDialogProps) {
  const [consentInfo, setConsentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConsentInfo();
    }
  }, [isOpen]);

  const loadConsentInfo = async () => {
    try {
      setLoading(true);
      const response = await aiAPI.getConsentInfo();
      setConsentInfo(response.data);
    } catch (error) {
      console.error('Error loading consent info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!acknowledged) {
      // Show inline error instead of alert
      return;
    }
    
    grantAIConsent(requestedMode);
    onConsent(requestedMode);
    onClose();
  };

  const handleDecline = () => {
    revokeAIConsent();
    onClose();
  };

  if (!isOpen) return null;

  const modeInfo = consentInfo?.modes?.[requestedMode];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Enable AI Insights?
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              You're about to enable <strong>{modeInfo?.name || requestedMode}</strong> mode
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
          ) : (
            <>
              {/* Mode Description */}
              <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h3 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                  About {modeInfo?.name}
                </h3>
                <p className="text-purple-800 dark:text-purple-300 text-sm">
                  {modeInfo?.description}
                </p>
                <div className="mt-2 text-sm">
                  <span className="inline-block px-2 py-1 bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-200 rounded">
                    Privacy: {modeInfo?.privacy}
                  </span>
                </div>
              </div>

              {/* What We Send */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  ✅ What we send to AI:
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {consentInfo?.modes?.[requestedMode]?.data_transmitted?.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="capitalize">{item.replace(/_/g, ' ')}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* What We DON'T Send */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  ❌ What we DON'T send:
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {consentInfo?.data_never_transmitted?.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-red-500 mr-2">✗</span>
                      <span className="capitalize">{item.replace(/_/g, ' ')}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Privacy Guarantees */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  🔒 Privacy Guarantees
                </h3>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                  <li>✓ All data encrypted in transit (TLS 1.3)</li>
                  <li>✓ No long-term data storage</li>
                  <li>✓ Only astrological data transmitted</li>
                  <li>✓ Can disable anytime in Settings</li>
                  <li>✓ Offline mode always available</li>
                </ul>
              </div>

              {/* Important Notice */}
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-400">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  ⚠️ Important
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  This feature requires sending your astrological chart data (not personal info)
                  to our secure backend, which forwards it to OpenAI for enhanced predictions.
                  Your privacy is our priority.
                </p>
              </div>

              {/* Acknowledgment Checkbox */}
              <div className="mb-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    className="mt-1 h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I have read and understood the privacy information above. I consent to
                    having my astrological chart data (no personal identifiers) transmitted
                    for AI-enhanced insights.
                  </span>
                </label>
                {!acknowledged && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    ⚠️ Please check the box above to enable AI features
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDecline}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Stay Offline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={!acknowledged}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                    acknowledged
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Enable AI
                </button>
              </div>

              {/* Learn More Link */}
              <div className="mt-4 text-center">
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Learn more in our Privacy Policy →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
