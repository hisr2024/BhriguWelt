/** `/unlock?next=<current path>` so unlocking returns to the page the user was on. */
export function unlockHref(): string {
  if (typeof window === 'undefined') return '/unlock';
  const here = window.location.pathname + window.location.search;
  return here.startsWith('/unlock') ? '/unlock' : `/unlock?next=${encodeURIComponent(here)}`;
}

/** Only same-site paths are honoured as a return target. */
export function safeNext(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/unlock')) return fallback;
  return next;
}
