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

const ERROR_TITLE_MAP: Record<string, string> = {
  VALIDATION_ERROR: 'Validation error',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Not found',
  PAYLOAD_TOO_LARGE: 'Request too large',
  RATE_LIMIT_EXCEEDED: 'Too many requests',
  INVALID_GZIP: 'Invalid request payload',
  CSRF_TOKEN_MISSING: 'Security check failed',
  CSRF_VALIDATION_FAILED: 'Security check failed',
  INTERNAL_ERROR: 'Server error',
};

export function resolveToastTitle(payload: ToastPayload): string {
  if (payload.title) {
    return payload.title;
  }

  if (payload.errorCode && payload.errorCode in ERROR_TITLE_MAP) {
    return ERROR_TITLE_MAP[payload.errorCode];
  }

  if (payload.type === 'error') {
    return 'Something went wrong';
  }

  return 'Notice';
}

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
