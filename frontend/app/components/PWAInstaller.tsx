'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered:', registration.scope);

            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60000); // Check every minute

            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log('[PWA] New version available! Reload to update.');
                    // You can show a notification to the user here
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error);
          });
      });
    }

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_REPORTS') {
        event.ports?.[0]?.postMessage({ ok: true });
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Check if user has already dismissed the prompt
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`[PWA] User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-24 left-0 right-0 z-50 px-4 sm:left-auto sm:right-4 sm:w-96 animate-slide-up">
      <div className="bg-gradient-to-br from-genz-electric-blue/90 to-genz-purple-haze/90 backdrop-blur-2xl rounded-2xl shadow-genz-glow border border-white/20 p-6 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-mesh-gradient opacity-20"></div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-xl">
              <Download className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">
              Install BhriguWelt
            </h3>
          </div>

          <p className="text-white/90 text-sm mb-4 leading-relaxed">
            Install our app for a better experience. Access your soul journey offline, anytime.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 py-3 px-4 bg-white text-genz-purple-haze font-bold rounded-xl hover:bg-white/90 transition-all duration-300 hover:scale-105"
            >
              Install Now
            </button>
            <button
              onClick={handleDismiss}
              className="py-3 px-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors backdrop-blur-xl"
            >
              Maybe Later
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
            <span>✓</span>
            <span>Works offline</span>
            <span>•</span>
            <span>Instant access</span>
            <span>•</span>
            <span>No extra space</span>
          </div>
        </div>
      </div>
    </div>
  );
}
