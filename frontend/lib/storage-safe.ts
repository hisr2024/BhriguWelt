import { getItem } from './storage';

export async function getItemSafe(
  storeName: string,
  key: string | number,
  decryptionKey?: CryptoKey
): Promise<any | null> {
  try {
    const stored = await getItem(storeName, key, decryptionKey);
    if (stored === undefined) {
      return null;
    }
    return stored ?? null;
  } catch (error) {
    console.warn('storage-safe: getItem failed, falling back to null', error);
  }

  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    try {
      const raw = window.localStorage.getItem(String(key));
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn('storage-safe: localStorage fallback failed', error);
      return null;
    }
  }

  return null;
}
