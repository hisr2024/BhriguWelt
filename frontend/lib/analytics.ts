/**
 * Privacy-First Analytics System
 * Local analytics without external tracking
 * All data stays on device
 */

export interface AnalyticsEvent {
  id?: number;
  type: 'page_view' | 'feature_use' | 'error' | 'interaction' | 'performance' | 'custom';
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, any>;
  timestamp: string;
  sessionId: string;
}

export interface AnalyticsSession {
  id: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  pageViews: number;
  events: number;
  deviceInfo: {
    platform: string;
    userAgent: string;
    language: string;
    screenSize: string;
  };
}

const DB_NAME = 'AnalyticsDB';
const DB_VERSION = 1;
const EVENTS_STORE = 'events';
const SESSIONS_STORE = 'sessions';
let db: IDBDatabase | null = null;
let currentSessionId: string | null = null;

/**
 * Initialize analytics database
 */
async function initAnalyticsDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Failed to open analytics database'));
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Events store
      if (!database.objectStoreNames.contains(EVENTS_STORE)) {
        const eventStore = database.createObjectStore(EVENTS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        eventStore.createIndex('type', 'type', { unique: false });
        eventStore.createIndex('category', 'category', { unique: false });
        eventStore.createIndex('timestamp', 'timestamp', { unique: false });
        eventStore.createIndex('sessionId', 'sessionId', { unique: false });
      }

      // Sessions store
      if (!database.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessionStore = database.createObjectStore(SESSIONS_STORE, {
          keyPath: 'id',
        });
        sessionStore.createIndex('startTime', 'startTime', { unique: false });
      }
    };
  });
}

/**
 * Get or create current session
 */
function getSessionId(): string {
  if (currentSessionId) return currentSessionId;

  // Check localStorage for existing session
  const stored = localStorage.getItem('analytics_session');
  if (stored) {
    const session = JSON.parse(stored);
    const sessionAge = Date.now() - new Date(session.startTime).getTime();
    // Session expires after 30 minutes of inactivity
    if (sessionAge < 30 * 60 * 1000) {
      currentSessionId = session.id;
      return currentSessionId;
    }
  }

  // Create new session
  currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newSession = {
    id: currentSessionId,
    startTime: new Date().toISOString(),
  };
  localStorage.setItem('analytics_session', JSON.stringify(newSession));
  return currentSessionId;
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  type: AnalyticsEvent['type'],
  category: string,
  action: string,
  options?: {
    label?: string;
    value?: number;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    const database = await initAnalyticsDB();
    const sessionId = getSessionId();

    const event: AnalyticsEvent = {
      type,
      category,
      action,
      label: options?.label,
      value: options?.value,
      metadata: options?.metadata,
      timestamp: new Date().toISOString(),
      sessionId,
    };

    const transaction = database.transaction(EVENTS_STORE, 'readwrite');
    const store = transaction.objectStore(EVENTS_STORE);
    store.add(event);

    // Update session
    updateSession(sessionId);
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent('page_view', 'navigation', 'page_view', {
    label: path,
    metadata: { title },
  });
}

/**
 * Track feature usage
 */
export function trackFeature(featureName: string, metadata?: Record<string, any>): void {
  trackEvent('feature_use', 'features', 'use', {
    label: featureName,
    metadata,
  });
}

/**
 * Track error
 */
export function trackError(error: Error, context?: Record<string, any>): void {
  trackEvent('error', 'errors', 'client_error', {
    label: error.message,
    metadata: {
      stack: error.stack,
      ...context,
    },
  });
}

/**
 * Track interaction
 */
export function trackInteraction(element: string, action: string, metadata?: Record<string, any>): void {
  trackEvent('interaction', 'ui', action, {
    label: element,
    metadata,
  });
}

/**
 * Track performance metric
 */
export function trackPerformance(metric: string, value: number, metadata?: Record<string, any>): void {
  trackEvent('performance', 'metrics', metric, {
    value,
    metadata,
  });
}

/**
 * Update current session
 */
async function updateSession(sessionId: string): Promise<void> {
  try {
    const database = await initAnalyticsDB();
    const transaction = database.transaction([SESSIONS_STORE, EVENTS_STORE], 'readwrite');
    const sessionStore = transaction.objectStore(SESSIONS_STORE);
    const eventStore = transaction.objectStore(EVENTS_STORE);

    // Get existing session or create new
    const sessionRequest = sessionStore.get(sessionId);

    sessionRequest.onsuccess = () => {
      const existingSession = sessionRequest.result;
      const eventIndex = eventStore.index('sessionId');
      const eventsRequest = eventIndex.count(sessionId);

      eventsRequest.onsuccess = () => {
        const eventCount = eventsRequest.result;

        const session: AnalyticsSession = existingSession || {
          id: sessionId,
          startTime: new Date().toISOString(),
          pageViews: 0,
          events: 0,
          deviceInfo: {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenSize: `${window.screen.width}x${window.screen.height}`,
          },
        };

        session.endTime = new Date().toISOString();
        session.events = eventCount;

        if (session.startTime) {
          const duration = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
          session.duration = Math.floor(duration / 1000); // seconds
        }

        sessionStore.put(session);
      };
    };
  } catch (error) {
    console.error('Failed to update session:', error);
  }
}

/**
 * Get analytics data
 */
export async function getAnalytics(options?: {
  type?: AnalyticsEvent['type'];
  category?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<AnalyticsEvent[]> {
  try {
    const database = await initAnalyticsDB();
    const transaction = database.transaction(EVENTS_STORE, 'readonly');
    const store = transaction.objectStore(EVENTS_STORE);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        let events = request.result;

        // Filter by type
        if (options?.type) {
          events = events.filter(e => e.type === options.type);
        }

        // Filter by category
        if (options?.category) {
          events = events.filter(e => e.category === options.category);
        }

        // Filter by date range
        if (options?.startDate) {
          events = events.filter(e => new Date(e.timestamp) >= options.startDate!);
        }
        if (options?.endDate) {
          events = events.filter(e => new Date(e.timestamp) <= options.endDate!);
        }

        // Sort by timestamp (newest first)
        events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // Limit
        if (options?.limit) {
          events = events.slice(0, options.limit);
        }

        resolve(events);
      };

      request.onerror = () => reject(new Error('Failed to get analytics'));
    });
  } catch (error) {
    console.error('Failed to get analytics:', error);
    return [];
  }
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(): Promise<{
  totalEvents: number;
  totalSessions: number;
  topFeatures: Array<{ feature: string; count: number }>;
  topPages: Array<{ page: string; count: number }>;
  errorCount: number;
  avgSessionDuration: number;
}> {
  try {
    const database = await initAnalyticsDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([EVENTS_STORE, SESSIONS_STORE], 'readonly');
      const eventStore = transaction.objectStore(EVENTS_STORE);
      const sessionStore = transaction.objectStore(SESSIONS_STORE);

      const eventsRequest = eventStore.getAll();
      const sessionsRequest = sessionStore.getAll();

      Promise.all([
        new Promise<AnalyticsEvent[]>((res, rej) => {
          eventsRequest.onsuccess = () => res(eventsRequest.result);
          eventsRequest.onerror = () => rej(new Error('Failed to get events'));
        }),
        new Promise<AnalyticsSession[]>((res, rej) => {
          sessionsRequest.onsuccess = () => res(sessionsRequest.result);
          sessionsRequest.onerror = () => rej(new Error('Failed to get sessions'));
        }),
      ]).then(([events, sessions]) => {
        // Count features
        const featureCounts = new Map<string, number>();
        const pageCounts = new Map<string, number>();
        let errorCount = 0;

        events.forEach(event => {
          if (event.type === 'feature_use' && event.label) {
            featureCounts.set(event.label, (featureCounts.get(event.label) || 0) + 1);
          }
          if (event.type === 'page_view' && event.label) {
            pageCounts.set(event.label, (pageCounts.get(event.label) || 0) + 1);
          }
          if (event.type === 'error') {
            errorCount++;
          }
        });

        // Calculate average session duration
        const avgSessionDuration = sessions.length > 0
          ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
          : 0;

        resolve({
          totalEvents: events.length,
          totalSessions: sessions.length,
          topFeatures: Array.from(featureCounts.entries())
            .map(([feature, count]) => ({ feature, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          topPages: Array.from(pageCounts.entries())
            .map(([page, count]) => ({ page, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          errorCount,
          avgSessionDuration: Math.floor(avgSessionDuration),
        });
      }).catch(reject);
    });
  } catch (error) {
    console.error('Failed to get analytics summary:', error);
    return {
      totalEvents: 0,
      totalSessions: 0,
      topFeatures: [],
      topPages: [],
      errorCount: 0,
      avgSessionDuration: 0,
    };
  }
}

/**
 * Clear old analytics data
 */
export async function clearOldAnalytics(daysToKeep: number = 30): Promise<void> {
  try {
    const database = await initAnalyticsDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const transaction = database.transaction([EVENTS_STORE, SESSIONS_STORE], 'readwrite');
    const eventStore = transaction.objectStore(EVENTS_STORE);
    const sessionStore = transaction.objectStore(SESSIONS_STORE);

    // Clear old events
    const eventIndex = eventStore.index('timestamp');
    const eventRequest = eventIndex.openCursor(IDBKeyRange.upperBound(cutoffDate.toISOString()));

    eventRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    // Clear old sessions
    const sessionIndex = sessionStore.index('startTime');
    const sessionRequest = sessionIndex.openCursor(IDBKeyRange.upperBound(cutoffDate.toISOString()));

    sessionRequest.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (error) {
    console.error('Failed to clear old analytics:', error);
  }
}

/**
 * Export analytics data
 */
export async function exportAnalytics(): Promise<string> {
  try {
    const events = await getAnalytics();
    const summary = await getAnalyticsSummary();

    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      summary,
      events,
    }, null, 2);
  } catch (error) {
    console.error('Failed to export analytics:', error);
    return JSON.stringify({ error: 'Failed to export analytics' });
  }
}
