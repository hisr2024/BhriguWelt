// frontend/components/GDPRNotice.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, X, ExternalLink, Lock, Database, Eye, Globe } from 'lucide-react';

const GDPR_CONSENT_KEY = 'bhriguwelt_gdpr_consent';
const GDPR_CONSENT_VERSION = '1.0';

interface GDPRNoticeProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export function GDPRNotice({ onAccept, onDecline }: GDPRNoticeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem(GDPR_CONSENT_KEY);
    if (!consent || JSON.parse(consent).version !== GDPR_CONSENT_VERSION) {
      // Show notice after a brief delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // Store consent with timestamp and version
    const consent = {
      accepted: true,
      timestamp: new Date().toISOString(),
      version: GDPR_CONSENT_VERSION,
    };
    localStorage.setItem(GDPR_CONSENT_KEY, JSON.stringify(consent));
    setIsVisible(false);
    onAccept?.();
  };

  const handleDecline = () => {
    // Store decline decision
    const consent = {
      accepted: false,
      timestamp: new Date().toISOString(),
      version: GDPR_CONSENT_VERSION,
    };
    localStorage.setItem(GDPR_CONSENT_KEY, JSON.stringify(consent));
    setIsVisible(false);
    onDecline?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-dark-elevated border border-genz-electric-blue/30 rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-6 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white">Privacy & Data Protection</h2>
                    <p className="text-sm text-white/60 mt-1">Your data, your control - GDPR compliant</p>
                  </div>
                </div>
                <button
                  onClick={handleDecline}
                  className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  aria-label="Close GDPR notice"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Quick Summary */}
              <div className="space-y-3">
                <p className="text-white/80 leading-relaxed">
                  BhriguWelt respects your privacy and complies with GDPR regulations. Here's how we handle your data:
                </p>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <Lock className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white text-sm">Encrypted Storage</h3>
                      <p className="text-xs text-white/70 mt-1">All data encrypted with AES-256-GCM at rest</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <Database className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white text-sm">Local-First</h3>
                      <p className="text-xs text-white/70 mt-1">Your data stays on your device (IndexedDB)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <Eye className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white text-sm">Optional AI</h3>
                      <p className="text-xs text-white/70 mt-1">AI features require explicit consent</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <Globe className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-white text-sm">Your Rights</h3>
                      <p className="text-xs text-white/70 mt-1">Access, export, or delete your data anytime</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information (Expandable) */}
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
              >
                {showDetails ? 'Hide' : 'Show'} detailed information
                <motion.div
                  animate={{ rotate: showDetails ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ↓
                </motion.div>
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                      <h3 className="font-semibold text-white text-sm">Data We Collect:</h3>
                      <ul className="text-xs text-white/70 space-y-2 ml-4">
                        <li>• Birth details (date, time, location) - for astrological calculations</li>
                        <li>• Generated reports - stored locally in your browser</li>
                        <li>• Optional: AI interactions (only if you grant consent)</li>
                        <li>• Technical data: Error logs (anonymized), performance metrics</li>
                      </ul>

                      <h3 className="font-semibold text-white text-sm mt-4">Your GDPR Rights:</h3>
                      <ul className="text-xs text-white/70 space-y-2 ml-4">
                        <li>✓ <strong>Right to Access</strong> - View all your data in Settings</li>
                        <li>✓ <strong>Right to Portability</strong> - Export your data as JSON</li>
                        <li>✓ <strong>Right to Erasure</strong> - Delete all data permanently</li>
                        <li>✓ <strong>Right to Object</strong> - Opt out of AI features anytime</li>
                        <li>✓ <strong>Right to Rectification</strong> - Edit your profiles</li>
                      </ul>

                      <h3 className="font-semibold text-white text-sm mt-4">Data Retention:</h3>
                      <ul className="text-xs text-white/70 space-y-2 ml-4">
                        <li>• Local data: Stored until you delete it</li>
                        <li>• Server cache: 30 days (anonymized hash only)</li>
                        <li>• Error logs: 90 days (PII removed)</li>
                      </ul>

                      <h3 className="font-semibold text-white text-sm mt-4">Third-Party Services:</h3>
                      <ul className="text-xs text-white/70 space-y-2 ml-4">
                        <li>• OpenAI (optional, with consent) - AI predictions</li>
                        <li>• Sentry (optional) - Error tracking (PII filtered)</li>
                        <li>• All data anonymized before transmission</li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <ExternalLink className="w-4 h-4" />
                      <a
                        href="/docs/PRIVACY_AND_SECURITY.md"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-blue-400 transition-colors underline"
                      >
                        Read our complete Privacy & Security Guide
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Consent Notice */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-sm text-white/80">
                  <strong>By continuing, you acknowledge that:</strong>
                </p>
                <ul className="text-xs text-white/70 space-y-1 mt-2 ml-4">
                  <li>• You understand how your data is collected and used</li>
                  <li>• You can withdraw consent and delete data anytime in Settings</li>
                  <li>• AI features require separate explicit consent</li>
                  <li>• You are 16+ years old (GDPR requirement for consent)</li>
                </ul>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={handleDecline}
                className="px-6 py-3 rounded-xl font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                Decline & Exit
              </button>
              <button
                onClick={handleAccept}
                className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                I Accept & Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Settings page component for managing GDPR consent
export function GDPRSettings() {
  const [consent, setConsent] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem(GDPR_CONSENT_KEY);
    if (stored) {
      setConsent(JSON.parse(stored));
    }
  }, []);

  const handleRevokeConsent = () => {
    if (confirm('Are you sure? This will delete all your local data and require you to accept privacy policy again.')) {
      localStorage.removeItem(GDPR_CONSENT_KEY);
      // Clear all app data
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleExportData = () => {
    // Export all localStorage data as JSON
    const data = { ...localStorage };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bhriguwelt-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!consent) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-white">Privacy & GDPR Settings</h3>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white font-medium">Consent Status</p>
            <p className="text-xs text-white/60 mt-1">
              {consent.accepted ? 'Accepted' : 'Declined'} on{' '}
              {new Date(consent.timestamp).toLocaleDateString()}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            consent.accepted ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {consent.accepted ? 'Active' : 'Declined'}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <button
            onClick={handleExportData}
            className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all text-sm font-medium"
          >
            Export My Data
          </button>
          <button
            onClick={handleRevokeConsent}
            className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all text-sm font-medium"
          >
            Delete All Data
          </button>
        </div>
      </div>
    </div>
  );
}
