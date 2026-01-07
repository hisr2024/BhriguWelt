/**
 * Navigation History Tracker
 * Tracks user navigation for back/forward functionality and analytics
 */

export interface NavigationEntry {
  path: string;
  title: string;
  timestamp: string;
  referrer?: string;
  params?: Record<string, string>;
}

const MAX_HISTORY = 100;
const STORAGE_KEY = 'navigation_history';

class NavigationHistory {
  private history: NavigationEntry[] = [];
  private currentIndex: number = -1;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
    }
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.history = data.history || [];
        this.currentIndex = data.currentIndex || -1;
      }
    } catch (error) {
      console.error('Failed to load navigation history:', error);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        history: this.history,
        currentIndex: this.currentIndex,
      }));
    } catch (error) {
      console.error('Failed to save navigation history:', error);
    }
  }

  /**
   * Add a new navigation entry
   */
  push(entry: Omit<NavigationEntry, 'timestamp'>): void {
    // Remove any forward history when navigating to a new page
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Add new entry
    this.history.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });

    // Limit history size
    if (this.history.length > MAX_HISTORY) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }

    this.saveToStorage();
  }

  /**
   * Get the current entry
   */
  current(): NavigationEntry | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * Go back in history
   */
  back(): NavigationEntry | null {
    if (this.canGoBack()) {
      this.currentIndex--;
      this.saveToStorage();
      return this.current();
    }
    return null;
  }

  /**
   * Go forward in history
   */
  forward(): NavigationEntry | null {
    if (this.canGoForward()) {
      this.currentIndex++;
      this.saveToStorage();
      return this.current();
    }
    return null;
  }

  /**
   * Check if can go back
   */
  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if can go forward
   */
  canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * Get all history
   */
  getAll(): NavigationEntry[] {
    return [...this.history];
  }

  /**
   * Get recent history
   */
  getRecent(limit: number = 10): NavigationEntry[] {
    return this.history.slice(-limit).reverse();
  }

  /**
   * Clear history
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.saveToStorage();
  }

  /**
   * Search history
   */
  search(query: string): NavigationEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.history.filter(entry =>
      entry.title.toLowerCase().includes(lowerQuery) ||
      entry.path.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get most visited pages
   */
  getMostVisited(limit: number = 10): Array<{ path: string; title: string; count: number }> {
    const pathCounts = new Map<string, { title: string; count: number }>();

    this.history.forEach(entry => {
      const existing = pathCounts.get(entry.path);
      if (existing) {
        existing.count++;
      } else {
        pathCounts.set(entry.path, { title: entry.title, count: 1 });
      }
    });

    return Array.from(pathCounts.entries())
      .map(([path, data]) => ({ path, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get navigation patterns (common sequences)
   */
  getCommonPatterns(): Array<{ pattern: string[]; count: number }> {
    const patterns = new Map<string, number>();
    const sequenceLength = 3;

    for (let i = 0; i <= this.history.length - sequenceLength; i++) {
      const sequence = this.history
        .slice(i, i + sequenceLength)
        .map(e => e.path);
      const key = sequence.join(' → ');
      patterns.set(key, (patterns.get(key) || 0) + 1);
    }

    return Array.from(patterns.entries())
      .map(([pattern, count]) => ({ pattern: pattern.split(' → '), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
}

// Export singleton instance
export const navigationHistory = new NavigationHistory();

// Hook for use in React components
export function useNavigationHistory() {
  return navigationHistory;
}
