'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { onToast, ToastPayload } from '@/lib/toast';

interface ToastItem extends ToastPayload {
  id: string;
}

const TOAST_DURATIONS: Record<ToastPayload['type'], number> = {
  success: 5000,
  info: 6000,
  error: 9000,
};

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return onToast((payload) => {
      const id = generateId();
      const toast: ToastItem = { ...payload, id };
      setToasts((prev) => [...prev, toast]);

      const timeout = window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, TOAST_DURATIONS[payload.type]);
    });
  }, []);

  const colorClasses = useMemo(
    () => ({
      success: 'border-emerald-500/60 bg-emerald-500/15 text-emerald-50',
      info: 'border-sky-500/60 bg-sky-500/15 text-sky-50',
      error: 'border-rose-500/60 bg-rose-500/15 text-rose-50',
    }),
    []
  );

  return (
    <>
      {children}
      <div className="fixed top-6 right-6 z-50 flex w-full max-w-md flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border px-4 py-3 shadow-lg backdrop-blur ${colorClasses[toast.type]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {toast.title ?? (toast.type === 'error' ? 'Something went wrong' : 'Notice')}
                </p>
                <p className="mt-1 text-sm text-white/90">{toast.message}</p>
                {toast.errorCode ? (
                  <p className="mt-2 text-xs text-white/70">Error Code: {toast.errorCode}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
                className="rounded-full border border-white/30 px-2 py-1 text-xs text-white/80 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
            {toast.reportIssueUrl ? (
              <div className="mt-3">
                <a
                  href={toast.reportIssueUrl}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  Report Issue
                </a>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </>
  );
}
