/** Canonical public origin. Set NEXT_PUBLIC_SITE_URL in Vercel when a custom domain is used. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bhriguwelt.vercel.app').replace(/\/$/, '');

/** Public, indexable pages. Private screens (unlock, profile, settings…) are excluded on purpose. */
export const PUBLIC_ROUTES = ['/', '/privacy', '/terms', '/impressum'];
