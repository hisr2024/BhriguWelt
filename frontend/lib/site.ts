/** Canonical public origin (sitemap, robots, social cards). NEXT_PUBLIC_SITE_URL overrides it. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bhriguwelt.app').replace(/\/$/, '');

/** Public, indexable pages. Private screens (unlock, profile, settings…) are excluded on purpose. */
export const PUBLIC_ROUTES = ['/', '/privacy', '/terms', '/impressum'];
