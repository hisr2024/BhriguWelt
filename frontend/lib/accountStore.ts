/**
 * The signed session token of an (optional) BhriguWelt account.
 * Kept in localStorage so it survives app and website updates.
 */
export const SESSION_KEY = 'bhriguwelt_session';
export const ACCOUNT_KEY = 'bhriguwelt_account';

export interface StoredAccount {
  email: string;
  name?: string | null;
}

export function readSession(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function readStoredAccount(): StoredAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: string | null, account: StoredAccount | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (session && account) {
      window.localStorage.setItem(SESSION_KEY, session);
      window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(ACCOUNT_KEY);
    }
  } catch {
    /* storage blocked: signed in for this visit only */
  }
  window.dispatchEvent(new Event('bw-account-changed'));
}
