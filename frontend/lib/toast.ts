export type ToastType = 'success' | 'error' | 'info';

export interface ToastPayload {
  type: ToastType;
  title?: string;
  message: string;
  errorCode?: string;
  details?: Record<string, unknown>;
  reportIssueUrl?: string;
}

const TOAST_EVENT = 'bhriguwelt:toast';

export function emitToast(payload: ToastPayload): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: payload }));
}

export function onToast(handler: (payload: ToastPayload) => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<ToastPayload>;
    handler(customEvent.detail);
  };

  window.addEventListener(TOAST_EVENT, listener);
  return () => window.removeEventListener(TOAST_EVENT, listener);
}

export function buildIssueReportUrl(options: {
  message: string;
  errorCode?: string;
  details?: Record<string, unknown>;
  status?: number;
  url?: string;
  method?: string;
}): string {
  const subject = `BhriguWelt Issue Report${options.errorCode ? ` (${options.errorCode})` : ''}`;
  const bodyLines = [
    'Please describe what you were doing when the error occurred:',
    '',
    '--- Error Details ---',
    `Message: ${options.message}`,
  ];

  if (options.errorCode) {
    bodyLines.push(`Error Code: ${options.errorCode}`);
  }

  if (options.status) {
    bodyLines.push(`Status: ${options.status}`);
  }

  if (options.method || options.url) {
    bodyLines.push(`Request: ${options.method ?? ''} ${options.url ?? ''}`.trim());
  }

  if (options.details && Object.keys(options.details).length > 0) {
    bodyLines.push(`Details: ${JSON.stringify(options.details, null, 2)}`);
  }

  const body = bodyLines.join('\n');
  return `mailto:support@bhriguwelt.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
