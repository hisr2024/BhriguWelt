/**
 * Where the browser sends backend requests.
 *
 * Normally straight to the Flask backend on Render (NEXT_PUBLIC_API_URL).
 * Some networks and phones block that address before a request leaves the
 * device (ad-blocking DNS, Android "Private DNS", router filters), which the
 * browser reports only as ERR_NETWORK. For those devices the app switches to
 * '/backend' on its own domain, which Vercel forwards to the same backend
 * (see rewrites in next.config.js), and remembers the switch.
 */
const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
export const PROXY_BASE = '/backend';
const PROXY_FLAG = 'bhriguwelt_api_via_proxy';

export const isProxyMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(PROXY_FLAG) === '1';
  } catch {
    return false;
  }
};

export const enableProxyMode = (): void => {
  try {
    window.localStorage.setItem(PROXY_FLAG, '1');
  } catch {
    /* storage unavailable: the switch then lasts for this request only */
  }
};

/** Base for backend calls right now: the direct origin, or the same-origin proxy. */
export const apiBase = (): string => (isProxyMode() ? PROXY_BASE : BACKEND_ORIGIN);

export const directBackendOrigin = (): string => BACKEND_ORIGIN;

export const backendUrl = (path: string): string =>
  `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`;
