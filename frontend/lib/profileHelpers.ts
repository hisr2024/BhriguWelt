/**
 * Profile helper functions for loading and managing current profile
 * Provides centralized profile-loading logic with fallback support
 */

import { getItem, STORES } from './storage';

const CURRENT_PROFILE_ID_KEY = 'current_profile_id';

/**
 * Load the current user profile with resilient fallback logic
 *
 * Strategy:
 * 1. Try loading by ID from localStorage.current_profile_id
 * 2. Fall back to literal key 'current_profile' (uses storage fallback cursor)
 * 3. Fall back to scanning for most recent profile by updatedAt/createdAt
 *
 * @param encryptionKey - Optional encryption key for decrypting profile data
 * @returns Promise resolving to profile data or null if not found
 */
export async function loadCurrentProfile(encryptionKey?: CryptoKey): Promise<any | null> {
  try {
    // Strategy 1: Try loading by ID from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedId = window.localStorage.getItem(CURRENT_PROFILE_ID_KEY);
      if (storedId) {
        // Try to parse as number (autoIncrement IDs are numbers)
        const profileId = isNaN(Number(storedId)) ? storedId : Number(storedId);
        const profile = await getItem(STORES.PROFILES, profileId, encryptionKey);
        if (profile) {
          console.log(`Profile loaded by ID: ${profileId}`);
          return profile;
        }
        // ID was set but profile not found - clear stale ID
        console.warn(`Stored profile ID ${profileId} not found, clearing stale reference`);
        window.localStorage.removeItem(CURRENT_PROFILE_ID_KEY);
      }
    }

    // Strategy 2: Try loading by literal key 'current_profile'
    // This will use the fallback cursor implemented in storage.ts
    const profile = await getItem(STORES.PROFILES, 'current_profile', encryptionKey);
    if (profile) {
      console.log('Profile loaded by literal key "current_profile"');
      return profile;
    }

    // Strategy 3: Scan for most recent profile
    // This is a last-resort fallback
    console.warn('No profile found by ID or literal key, scanning for most recent profile');
    const mostRecent = await findMostRecentProfile(encryptionKey);
    if (mostRecent) {
      console.log('Profile loaded by most-recent scan');
      // Optionally persist this ID for future use
      if (mostRecent.id) {
        setCurrentProfileId(mostRecent.id);
      }
      return mostRecent;
    }

    console.warn('No profile found after exhaustive search');
    return null;
  } catch (error) {
    console.error('Error loading current profile:', error);
    return null;
  }
}

/**
 * Find the most recent profile by scanning all profiles
 * This is a read-only fallback operation
 *
 * @param encryptionKey - Optional encryption key for decrypting profile data
 * @returns Promise resolving to most recent profile or null
 */
async function findMostRecentProfile(encryptionKey?: CryptoKey): Promise<any | null> {
  try {
    // Open a cursor to scan profiles
    const database = await import('./storage').then(m => m.initDB());
    return new Promise((resolve) => {
      const transaction = database.transaction(STORES.PROFILES, 'readonly');
      const store = transaction.objectStore(STORES.PROFILES);
      const request = store.openCursor();

      let mostRecent: any = null;
      let mostRecentDate: Date | null = null;

      request.onsuccess = async (event: any) => {
        const cursor = event.target.result;

        if (!cursor) {
          // Done scanning
          resolve(mostRecent);
          return;
        }

        try {
          const entry = cursor.value;
          let profile: any = null;

          // Decrypt if necessary
          if (entry.encrypted && encryptionKey) {
            try {
              const { decryptFromStorage } = await import('./crypto');
              profile = await decryptFromStorage(entry.value, encryptionKey);
            } catch (error) {
              console.error('Failed to decrypt profile during scan', error);
              cursor.continue();
              return;
            }
          } else if (typeof entry.value === 'object' && entry.value !== null) {
            profile = entry.value;
          } else {
            cursor.continue();
            return;
          }

          // Check for updatedAt or createdAt timestamp
          const timestamp = profile.updatedAt || profile.createdAt;
          if (timestamp) {
            const date = new Date(timestamp);
            if (!mostRecentDate || date > mostRecentDate) {
              mostRecentDate = date;
              // Include the IndexedDB ID in the returned profile
              mostRecent = { ...profile, id: entry.id };
            }
          }
        } catch (error) {
          console.error('Error processing profile during scan', error);
        }

        cursor.continue();
      };

      request.onerror = () => {
        console.error('Error scanning profiles');
        resolve(null);
      };
    });
  } catch (error) {
    console.error('Error finding most recent profile:', error);
    return null;
  }
}

/**
 * Set the current profile ID in localStorage
 * This allows quick profile retrieval on subsequent loads
 *
 * @param id - The profile ID (number or string)
 */
export function setCurrentProfileId(id: string | number): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(CURRENT_PROFILE_ID_KEY, String(id));
      console.log(`Current profile ID set to: ${id}`);
    }
  } catch (error) {
    console.error('Error setting current profile ID:', error);
  }
}

/**
 * Clear the current profile ID from localStorage
 * Useful for logout or profile reset scenarios
 */
export function clearCurrentProfileId(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(CURRENT_PROFILE_ID_KEY);
      console.log('Current profile ID cleared');
    }
  } catch (error) {
    console.error('Error clearing current profile ID:', error);
  }
}

/**
 * Get the stored current profile ID without loading the full profile
 *
 * @returns The stored profile ID or null if not set
 */
export function getCurrentProfileId(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(CURRENT_PROFILE_ID_KEY);
    }
    return null;
  } catch (error) {
    console.error('Error getting current profile ID:', error);
    return null;
  }
}
