'use client';

import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

export default function OfflinePage() {
  const isOnline = useOnlineStatus();

  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-surface via-dark-elevated to-dark-surface flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Om Symbol */}
        <div className="text-8xl mb-8 animate-pulse opacity-50">
          ॐ
        </div>

        {/* Offline Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-genz-electric-blue/20 to-genz-purple-haze/20 flex items-center justify-center backdrop-blur-xl border border-white/10">
            <WifiOff className="w-12 h-12 text-white/70" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-4 bg-gradient-to-r from-genz-electric-blue via-genz-purple-haze to-genz-hot-pink bg-clip-text text-transparent">
          You&apos;re Offline
        </h1>

        {/* Description */}
        <p className="text-white/70 text-lg mb-8 leading-relaxed">
          {isOnline 
            ? "Connection restored! Click below to reload the page."
            : "BhriguWelt is an offline-first app. Most features work without internet, but this page requires a connection."}
        </p>

        {/* Status */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 ${
          isOnline 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'bg-red-500/20 border border-red-500/30'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
          <span className="text-sm font-medium text-white">
            {isOnline ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleRetry}
            disabled={!isOnline}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
              isOnline
                ? 'bg-gradient-to-r from-genz-electric-blue to-genz-purple-haze hover:scale-105 hover:shadow-genz-glow cursor-pointer'
                : 'bg-white/10 cursor-not-allowed opacity-50'
            }`}
          >
            <RefreshCw className={`w-5 h-5 ${isOnline ? 'animate-spin-slow' : ''}`} />
            {isOnline ? 'Reload Page' : 'Waiting for Connection...'}
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full py-4 px-6 rounded-2xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-xl border border-white/10"
          >
            Go Back
          </button>
        </div>

        {/* Offline Features Info */}
        <div className="mt-12 p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10">
          <h3 className="font-display font-bold text-white mb-3 text-lg">
            Available Offline:
          </h3>
          <ul className="text-white/70 text-sm space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-genz-neon-green">✓</span>
              <span>View saved birth charts and reports</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-genz-neon-green">✓</span>
              <span>Access wisdom cards library</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-genz-neon-green">✓</span>
              <span>Calculate birth charts with local data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-genz-neon-green">✓</span>
              <span>Export reports to PDF</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
