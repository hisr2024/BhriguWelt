/**
 * Offline Manager
 * Handles offline/online mode detection, switching, and data synchronization
 */

export type ConnectionMode = 'online' | 'offline' | 'hybrid';

export interface ConnectionStatus {
  mode: ConnectionMode;
  isOnline: boolean;
  lastOnline: Date | null;
  apiAvailable: boolean;
  syncPending: number;
}

export class OfflineManager {
  private static instance: OfflineManager;
  private mode: ConnectionMode = 'hybrid';
  private isOnline: boolean = true;
  private lastOnline: Date | null = null;
  private apiAvailable: boolean = true;
  private syncQueue: any[] = [];
  private listeners: Array<(status: ConnectionStatus) => void> = [];
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.init();
  }

  public static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private init(): void {
    // Check if we're in browser
    if (typeof window === 'undefined') return;

    // Set initial online status
    this.isOnline = navigator.onLine;
    this.lastOnline = this.isOnline ? new Date() : null;

    // Listen to online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Periodically check API availability
    this.startApiHealthCheck();

    // Restore mode from localStorage
    const savedMode = localStorage.getItem('connection_mode');
    const validModes: string[] = ['online', 'offline', 'hybrid'];
    if (savedMode && validModes.indexOf(savedMode) !== -1) {
      this.mode = savedMode as ConnectionMode;
    }
  }

  private handleOnline(): void {
    this.isOnline = true;
    this.lastOnline = new Date();
    this.notifyListeners();

    // Trigger sync if in hybrid mode
    if (this.mode === 'hybrid') {
      this.syncPendingData();
    }
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.notifyListeners();
  }

  private startApiHealthCheck(): void {
    // Check API health every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkApiHealth();
    }, 30000);

    // Initial check
    this.checkApiHealth();
  }

  private async checkApiHealth(): Promise<void> {
    if (!this.isOnline) {
      this.apiAvailable = false;
      return;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health/liveness', {
        signal: controller.signal,
        cache: 'no-cache'
      });

      clearTimeout(timeout);

      this.apiAvailable = response.ok;
    } catch (error) {
      this.apiAvailable = false;
    }

    this.notifyListeners();
  }

  public getStatus(): ConnectionStatus {
    return {
      mode: this.mode,
      isOnline: this.isOnline,
      lastOnline: this.lastOnline,
      apiAvailable: this.apiAvailable,
      syncPending: this.syncQueue.length
    };
  }

  public setMode(mode: ConnectionMode): void {
    this.mode = mode;
    localStorage.setItem('connection_mode', mode);
    this.notifyListeners();
  }

  public getMode(): ConnectionMode {
    return this.mode;
  }

  public shouldUseOnline(): boolean {
    if (this.mode === 'offline') return false;
    if (this.mode === 'online') return true;
    // Hybrid mode - use online if available
    return this.isOnline && this.apiAvailable;
  }

  public shouldUseOffline(): boolean {
    if (this.mode === 'online') return false;
    if (this.mode === 'offline') return true;
    // Hybrid mode - use offline if online not available
    return !this.isOnline || !this.apiAvailable;
  }

  public addToSyncQueue(data: any): void {
    this.syncQueue.push({
      ...data,
      timestamp: new Date().toISOString()
    });

    // Save to localStorage
    this.saveSyncQueue();

    // Try to sync if online
    if (this.shouldUseOnline()) {
      this.syncPendingData();
    }
  }

  private saveSyncQueue(): void {
    try {
      localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  private async syncPendingData(): Promise<void> {
    if (this.syncQueue.length === 0) return;
    if (!this.shouldUseOnline()) return;

    const itemsToSync = [...this.syncQueue];
    this.syncQueue = [];
    this.saveSyncQueue();

    for (const item of itemsToSync) {
      try {
        await this.syncItem(item);
      } catch (error) {
        console.error('Failed to sync item:', error);
        // Re-add to queue
        this.syncQueue.push(item);
      }
    }

    this.saveSyncQueue();
    this.notifyListeners();
  }

  private async syncItem(item: any): Promise<void> {
    // Implement actual sync logic here
    // This would typically involve sending data to the backend
    console.log('Syncing item:', item);
  }

  public subscribe(listener: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  public destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }

    this.listeners = [];
  }
}

// React Hook
export function useOfflineManager() {
  const [status, setStatus] = React.useState<ConnectionStatus>(
    OfflineManager.getInstance().getStatus()
  );

  React.useEffect(() => {
    const manager = OfflineManager.getInstance();
    const unsubscribe = manager.subscribe(setStatus);

    return unsubscribe;
  }, []);

  const setMode = React.useCallback((mode: ConnectionMode) => {
    OfflineManager.getInstance().setMode(mode);
  }, []);

  const addToSyncQueue = React.useCallback((data: any) => {
    OfflineManager.getInstance().addToSyncQueue(data);
  }, []);

  return {
    status,
    setMode,
    addToSyncQueue,
    shouldUseOnline: OfflineManager.getInstance().shouldUseOnline(),
    shouldUseOffline: OfflineManager.getInstance().shouldUseOffline()
  };
}

// Helper functions
export function getConnectionMode(): ConnectionMode {
  return OfflineManager.getInstance().getMode();
}

export function setConnectionMode(mode: ConnectionMode): void {
  OfflineManager.getInstance().setMode(mode);
}

export function isOnlineMode(): boolean {
  return OfflineManager.getInstance().shouldUseOnline();
}

export function isOfflineMode(): boolean {
  return OfflineManager.getInstance().shouldUseOffline();
}

export function getConnectionStatus(): ConnectionStatus {
  return OfflineManager.getInstance().getStatus();
}

// Singleton instance
export const offlineManager = OfflineManager.getInstance();

// React import (will be provided by consuming components)
import * as React from 'react';
