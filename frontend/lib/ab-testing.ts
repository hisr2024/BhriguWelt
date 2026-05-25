/**
 * A/B Testing Framework
 * Privacy-friendly feature testing and optimization
 * All data stored locally
 */

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  variants: {
    id: string;
    name: string;
    weight: number; // 0-100, sum of all weights should be 100
    config?: Record<string, any>;
  }[];
  startDate: string;
  endDate?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetAudience?: {
    platform?: string[];
    language?: string[];
    customFilter?: (user: any) => boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ABTestAssignment {
  testId: string;
  variantId: string;
  userId: string;
  assignedAt: string;
}

export interface ABTestMetrics {
  testId: string;
  variantId: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  customMetrics?: Record<string, number>;
}

const TESTS_STORE = 'ab_tests';
const ASSIGNMENTS_STORE = 'ab_assignments';
const METRICS_STORE = 'ab_metrics';
const DB_NAME = 'ABTestingDB';
const DB_VERSION = 1;
let db: IDBDatabase | null = null;

/**
 * Initialize A/B testing database
 */
async function initABTestDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Failed to open A/B testing database'));
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Tests store
      if (!database.objectStoreNames.contains(TESTS_STORE)) {
        const testsStore = database.createObjectStore(TESTS_STORE, { keyPath: 'id' });
        testsStore.createIndex('status', 'status', { unique: false });
        testsStore.createIndex('startDate', 'startDate', { unique: false });
      }

      // Assignments store
      if (!database.objectStoreNames.contains(ASSIGNMENTS_STORE)) {
        const assignmentsStore = database.createObjectStore(ASSIGNMENTS_STORE, {
          keyPath: ['testId', 'userId'],
        });
        assignmentsStore.createIndex('testId', 'testId', { unique: false });
        assignmentsStore.createIndex('userId', 'userId', { unique: false });
      }

      // Metrics store
      if (!database.objectStoreNames.contains(METRICS_STORE)) {
        const metricsStore = database.createObjectStore(METRICS_STORE, {
          keyPath: ['testId', 'variantId'],
        });
        metricsStore.createIndex('testId', 'testId', { unique: false });
      }
    };
  });
}

/**
 * Get or generate user ID for A/B testing
 */
function getUserId(): string {
  let userId = localStorage.getItem('ab_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('ab_user_id', userId);
  }
  return userId;
}

/**
 * Create a new A/B test
 */
export async function createABTest(test: Omit<ABTest, 'createdAt' | 'updatedAt'>): Promise<void> {
  const database = await initABTestDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TESTS_STORE, 'readwrite');
    const store = transaction.objectStore(TESTS_STORE);

    const now = new Date().toISOString();
    const fullTest: ABTest = {
      ...test,
      createdAt: now,
      updatedAt: now,
    };

    const request = store.put(fullTest);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to create A/B test'));
  });
}

/**
 * Get active A/B tests
 */
export async function getActiveTests(): Promise<ABTest[]> {
  const database = await initABTestDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TESTS_STORE, 'readonly');
    const store = transaction.objectStore(TESTS_STORE);
    const index = store.index('status');
    const request = index.getAll('active');

    request.onsuccess = () => {
      const tests = request.result.filter((test: ABTest) => {
        const now = new Date();
        const startDate = new Date(test.startDate);
        const endDate = test.endDate ? new Date(test.endDate) : null;

        return now >= startDate && (!endDate || now <= endDate);
      });
      resolve(tests);
    };
    request.onerror = () => reject(new Error('Failed to get active tests'));
  });
}

/**
 * Assign user to a variant
 */
export async function getVariant(testId: string): Promise<string | null> {
  try {
    await initABTestDB();
    const userId = getUserId();

    // Check if already assigned
    const existing = await getAssignment(testId, userId);
    if (existing) {
      return existing.variantId;
    }

    // Get the test
    const test = await getTest(testId);
    if (!test || test.status !== 'active') {
      return null;
    }

    // Check target audience
    if (test.targetAudience) {
      const { platform, language } = test.targetAudience;
      if (platform && !platform.includes(navigator.platform)) {
        return null;
      }
      if (language && !language.includes(navigator.language)) {
        return null;
      }
    }

    // Assign to a variant based on weights
    const variantId = selectVariant(test.variants);

    // Save assignment
    const assignment: ABTestAssignment = {
      testId,
      variantId,
      userId,
      assignedAt: new Date().toISOString(),
    };

    await saveAssignment(assignment);

    // Track impression
    await trackImpression(testId, variantId);

    return variantId;
  } catch (error) {
    console.error('Failed to get variant:', error);
    return null;
  }
}

/**
 * Select variant based on weights
 */
function selectVariant(variants: ABTest['variants']): string {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      return variant.id;
    }
  }

  // Fallback to first variant
  return variants[0]!.id;
}

/**
 * Get test by ID
 */
async function getTest(testId: string): Promise<ABTest | null> {
  const database = await initABTestDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TESTS_STORE, 'readonly');
    const store = transaction.objectStore(TESTS_STORE);
    const request = store.get(testId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get test'));
  });
}

/**
 * Get assignment
 */
async function getAssignment(testId: string, userId: string): Promise<ABTestAssignment | null> {
  const database = await initABTestDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ASSIGNMENTS_STORE, 'readonly');
    const store = transaction.objectStore(ASSIGNMENTS_STORE);
    const request = store.get([testId, userId]);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(new Error('Failed to get assignment'));
  });
}

/**
 * Save assignment
 */
async function saveAssignment(assignment: ABTestAssignment): Promise<void> {
  const database = await initABTestDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(ASSIGNMENTS_STORE, 'readwrite');
    const store = transaction.objectStore(ASSIGNMENTS_STORE);
    const request = store.put(assignment);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save assignment'));
  });
}

/**
 * Track impression
 */
export async function trackImpression(testId: string, variantId: string): Promise<void> {
  const database = await initABTestDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(METRICS_STORE, 'readwrite');
    const store = transaction.objectStore(METRICS_STORE);
    const request = store.get([testId, variantId]);

    request.onsuccess = () => {
      const metrics: ABTestMetrics = request.result || {
        testId,
        variantId,
        impressions: 0,
        conversions: 0,
        conversionRate: 0,
      };

      metrics.impressions++;
      metrics.conversionRate = metrics.conversions / metrics.impressions;

      const updateRequest = store.put(metrics);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(new Error('Failed to track impression'));
    };

    request.onerror = () => reject(new Error('Failed to get metrics'));
  });
}

/**
 * Track conversion
 */
export async function trackConversion(testId: string, variantId?: string): Promise<void> {
  const database = await initABTestDB();
  const userId = getUserId();

  // If variantId not provided, get from assignment
  let resolvedVariantId = variantId;
  if (!resolvedVariantId) {
    const assignment = await getAssignment(testId, userId);
    if (!assignment) return;
    resolvedVariantId = assignment.variantId;
  }

  // Ensure variantId is defined
  if (!resolvedVariantId) return;

  // Create a constant to help TypeScript understand the type
  const definiteVariantId: string = resolvedVariantId;

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(METRICS_STORE, 'readwrite');
    const store = transaction.objectStore(METRICS_STORE);
    const request = store.get([testId, definiteVariantId]);

    request.onsuccess = () => {
      const metrics: ABTestMetrics = request.result || {
        testId,
        variantId: definiteVariantId,
        impressions: 0,
        conversions: 0,
        conversionRate: 0,
      };

      metrics.conversions++;
      metrics.conversionRate = metrics.conversions / metrics.impressions;

      const updateRequest = store.put(metrics);
      updateRequest.onsuccess = () => resolve();
      updateRequest.onerror = () => reject(new Error('Failed to track conversion'));
    };

    request.onerror = () => reject(new Error('Failed to get metrics'));
  });
}

/**
 * Get test results
 */
export async function getTestResults(testId: string): Promise<ABTestMetrics[]> {
  const database = await initABTestDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(METRICS_STORE, 'readonly');
    const store = transaction.objectStore(METRICS_STORE);
    const index = store.index('testId');
    const request = index.getAll(testId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Failed to get test results'));
  });
}

/**
 * React hook for A/B testing
 */
export function useABTest(testId: string): {
  variant: string | null;
  isLoading: boolean;
  trackConversion: () => void;
} {
  const [variant, setVariant] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    getVariant(testId)
      .then(setVariant)
      .finally(() => setIsLoading(false));
  }, [testId]);

  const handleConversion = React.useCallback(() => {
    if (variant) {
      trackConversion(testId, variant);
    }
  }, [testId, variant]);

  return {
    variant,
    isLoading,
    trackConversion: handleConversion,
  };
}

// Import React for the hook
import React from 'react';
