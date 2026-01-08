'use client';

import { useState } from 'react';
import { Lock, Check, X, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEncryption } from '@/lib/context/EncryptionContext';

interface PasscodeSetupProps {
  onComplete: () => void;
}

export default function PasscodeSetup({ onComplete }: PasscodeSetupProps) {
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [error, setError] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { setupPasscode } = useEncryption();

  const handlePasscodeChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    
    if (step === 'enter') {
      setPasscode(sanitized);
      setError('');
    } else {
      setConfirmPasscode(sanitized);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'enter') {
      if (passcode.length < 4) {
        setError('Passcode must be at least 4 digits');
        return;
      }
      setStep('confirm');
    } else {
      if (passcode !== confirmPasscode) {
        setError('Passcodes do not match');
        setConfirmPasscode('');
        return;
      }

      try {
        setIsLoading(true);
        const success = await setupPasscode(passcode);
        
        if (success) {
          onComplete();
        } else {
          setError('Failed to setup encryption. Please try again.');
        }
      } catch (err) {
        setError('Failed to setup encryption. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    setStep('enter');
    setConfirmPasscode('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-surface via-dark-elevated to-dark-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            className="text-6xl mb-4"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            ॐ
          </motion.div>
          <h1 className="text-3xl font-display font-bold mb-2 bg-gradient-to-r from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink bg-clip-text text-transparent">
            Secure Your Journey
          </h1>
          <p className="text-white/70 text-lg">
            {step === 'enter' 
              ? 'Create a passcode to encrypt your data'
              : 'Confirm your passcode'}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-genz-glow">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-genz-electric-blue to-genz-purple-haze flex items-center justify-center shadow-genz-glow">
              <Lock className="w-10 h-10 text-white" />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="passcode-input" className="block text-white font-medium mb-3">
                {step === 'enter' ? 'Enter Passcode' : 'Confirm Passcode'}
              </label>
              <div className="relative">
                <input
                  id="passcode-input"
                  name="passcode"
                  type={showPasscode ? 'text' : 'password'}
                  value={step === 'enter' ? passcode : confirmPasscode}
                  onChange={(e) => handlePasscodeChange(e.target.value)}
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:border-genz-electric-blue transition-colors"
                  placeholder="••••"
                  maxLength={6}
                  autoFocus
                  disabled={isLoading}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                >
                  {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {step === 'enter' && passcode.length > 0 && (
                <div className="mt-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <div
                        key={n}
                        className={`flex-1 h-1 rounded-full transition-colors ${
                          passcode.length >= n
                            ? passcode.length >= 6
                              ? 'bg-green-400'
                              : passcode.length >= 4
                              ? 'bg-yellow-400'
                              : 'bg-red-400'
                            : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-white/60 mt-2">
                    {passcode.length < 4
                      ? 'Weak - at least 4 digits required'
                      : passcode.length < 6
                      ? 'Good - 6 digits recommended'
                      : 'Strong - excellent security'}
                  </p>
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 flex items-center gap-2 text-red-400 text-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-genz-neon-green" />
                Your data will be:
              </h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-genz-electric-blue" />
                  Encrypted with AES-256-GCM
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-genz-electric-blue" />
                  Stored locally on your device
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-genz-electric-blue" />
                  Never uploaded to servers
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-genz-electric-blue" />
                  Protected by your passcode
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              {step === 'confirm' && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isLoading}
                  className="flex-1 py-4 px-6 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={
                  isLoading ||
                  (step === 'enter' && passcode.length < 4) ||
                  (step === 'confirm' && confirmPasscode.length < 4)
                }
                className="flex-1 py-4 px-6 bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze hover:scale-105 text-white font-bold rounded-xl transition-all shadow-genz-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Setting up...
                  </span>
                ) : step === 'enter' ? (
                  'Continue'
                ) : (
                  'Complete Setup'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-xs text-yellow-200/90 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                <strong>Important:</strong> Keep your passcode safe. If you forget it, you won&apos;t be able to access your encrypted data.
              </span>
            </p>
          </div>
        </div>

        <p className="text-center text-white/50 text-sm mt-6">
          This passcode never leaves your device and is used only for local encryption
        </p>
      </motion.div>
    </div>
  );
}
