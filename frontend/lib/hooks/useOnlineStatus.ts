import { useEffect, useState } from 'react';

type OnlineStatusListener = (isOnline: boolean) => void;

const listeners = new Set<OnlineStatusListener>();
let isListening = false;
let currentStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;

const notifyListeners = (status: boolean) => {
  currentStatus = status;
  listeners.forEach((listener) => listener(status));
};

const handleOnline = () => notifyListeners(true);
const handleOffline = () => notifyListeners(false);

const registerListeners = () => {
  if (isListening || typeof window === 'undefined') {
    return;
  }
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  isListening = true;
};

const unregisterListeners = () => {
  if (!isListening || typeof window === 'undefined') {
    return;
  }
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  isListening = false;
};

export function useOnlineStatus(onChange?: OnlineStatusListener) {
  const [isOnline, setIsOnline] = useState(currentStatus);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const listener: OnlineStatusListener = (status) => {
      setIsOnline(status);
      onChange?.(status);
    };

    listeners.add(listener);
    registerListeners();
    listener(currentStatus);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        unregisterListeners();
      }
    };
  }, [onChange]);

  return isOnline;
}
