/**
 * The signed premium entitlement this browser holds (issued by the backend
 * after a Google Play or Stripe purchase). It names the subscription, not
 * the person; the backend re-checks it with the store.
 */
export const ENTITLEMENT_KEY = 'bhriguwelt_entitlement';

export function readEntitlement(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(ENTITLEMENT_KEY);
  } catch {
    return null;
  }
}

export function saveEntitlement(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) window.localStorage.setItem(ENTITLEMENT_KEY, token);
    else window.localStorage.removeItem(ENTITLEMENT_KEY);
  } catch {
    /* storage blocked: premium lasts for this visit only */
  }
  window.dispatchEvent(new Event('bw-premium-changed'));
}
