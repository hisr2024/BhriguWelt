'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastOptions {
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastContextValue {
  addToast: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const variantStyles: Record<ToastVariant, string> = {
  info: 'bg-slate-900/90 text-white border border-slate-700',
  success: 'bg-emerald-600/90 text-white border border-emerald-400/60',
  warning: 'bg-amber-500/90 text-slate-900 border border-amber-300/70',
  error: 'bg-red-600/90 text-white border border-red-400/70',
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutIdsRef = useRef<Map<string, number>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
    const timeoutId = timeoutIdsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const variant = options.variant ?? 'info';
    const durationMs = options.durationMs ?? 4000;

    setToasts(prev => [...prev, { id, message, variant }]);

    const timeoutId = window.setTimeout(() => {
      removeToast(id);
    }, durationMs);

    timeoutIdsRef.current.set(id, timeoutId);
  }, [removeToast]);

  useEffect(() => () => {
    timeoutIdsRef.current.forEach(timeoutId => window.clearTimeout(timeoutId));
    timeoutIdsRef.current.clear();
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg backdrop-blur ${variantStyles[toast.variant]}`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
