'use client';

import { useEffect, useRef, useState } from 'react';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if ((window as any).google?.accounts?.id) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gisPromise = null;
        reject(new Error('Google sign-in could not load'));
      };
      document.head.appendChild(script);
    });
  }
  return gisPromise;
}

/** "Continue with Google" — Google Identity Services button (ID token flow). */
export function GoogleSignInButton({
  clientId,
  onCredential,
  onError,
}: {
  clientId: string;
  onCredential: (credential: string) => void;
  onError?: (message: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !ref.current) return;
        const gid = (window as any).google.accounts.id;
        gid.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            if (response?.credential) onCredential(response.credential);
            else onError?.('Google sign-in was cancelled.');
          },
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        gid.renderButton(ref.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: Math.min(360, ref.current.offsetWidth || 320),
        });
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          onError?.('Google sign-in could not load. Use your e-mail instead.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [clientId, onCredential, onError]);

  if (failed) return null;
  return <div ref={ref} className="flex min-h-[44px] w-full justify-center" />;
}

export default GoogleSignInButton;
