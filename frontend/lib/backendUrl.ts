/**
 * Absolute URL on the Flask backend (Render). Relative '/api/...' paths hit the
 * Next.js app on Vercel instead, which has no AI routes.
 */
const BACKEND_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export const backendUrl = (path: string): string =>
  `${BACKEND_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
