'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PasscodeUnlockProps {
  onUnlock: (passcode: string) => Promise<boolean>;
  onForgotPasscode?: () => void;
}

export default function PasscodeUnlock({ onUnlock, onForgotPasscode }: PasscodeUnlockProps) {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handlePasscodeChange = (value: string) => {
    // Only allow digits, max 6 characters
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    setPasscode(sanitized);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passcode.length < 4) {
      setError('Passcode must be at least 4 digits');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Let the parent handle verification via unlockWithPasscode
      const success = await onUnlock(passcode);
      
      if (!success) {
        setError('Incorrect passcode');
        setAttempts(prev => prev + 1);
        setPasscode('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (passcode.length < 6) {
      handlePasscodeChange(passcode + digit);
    }
  };

  const handleBackspace = () => {
    setPasscode(passcode.slice(0, -1));
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-surface via-dark-elevated to-dark-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Om Symbol */}
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
            Welcome Back
          </h1>
          <p className="text-white/70 text-lg">
            Enter your passcode to continue
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-genz-glow">
          <div className="flex justify-center mb-8">
            <motion.div
              animate={
                error
                  ? {
                      rotate: [0, -10, 10, -10, 10, 0],
                      transition: { duration: 0.5 },
                    }
                  : {}
              }
              className="w-20 h-20 rounded-full bg-gradient-to-br from-genz-electric-blue to-genz-purple-haze flex items-center justify-center shadow-genz-glow"
            >
              <Lock className="w-10 h-10 text-white" />
            </motion.div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-white font-medium mb-3 text-center">
                Passcode
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => handlePasscodeChange(e.target.value)}
                  className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:border-genz-electric-blue transition-colors"
                  placeholder="••••"
                  maxLength={6}
                  autoFocus
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Passcode dots indicator */}
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: passcode.length > i ? 1 : 0.5 }}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      passcode.length > i
                        ? 'bg-genz-electric-blue'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-4 flex items-center justify-center gap-2 text-red-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Attempts warning */}
              {attempts >= 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl"
                >
                  <p className="text-xs text-yellow-200/90 text-center">
                    Multiple failed attempts detected. Please ensure you&apos;re using the correct passcode.
                  </p>
                </motion.div>
              )}
            </div>

            {/* Numpad (optional, for mobile-friendly input) */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit.toString())}
                  disabled={isLoading || passcode.length >= 6}
                  className="py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isLoading || passcode.length === 0}
                className="py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                disabled={isLoading || passcode.length >= 6}
                className="py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                0
              </button>
              <button
                type="submit"
                disabled={isLoading || passcode.length < 4}
                className="py-4 bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze hover:scale-105 text-white font-bold rounded-xl transition-all shadow-genz-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 mx-auto border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  '✓'
                )}
              </button>
            </div>
          </form>

          {/* Forgot passcode */}
          {onForgotPasscode && (
            <div className="text-center">
              <button
                onClick={onForgotPasscode}
                className="text-sm text-genz-electric-blue hover:text-genz-purple-haze transition-colors"
              >
                Forgot passcode?
              </button>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-genz-electric-blue/20 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-genz-electric-blue" />
            </div>
            <div>
              <p className="text-white font-medium text-sm mb-1">
                Your data is encrypted
              </p>
              <p className="text-white/60 text-xs">
                All profiles, reports, and wisdom cards are protected with AES-256 encryption
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
