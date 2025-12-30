export type MatchmakingPair = {
  id: string;
  primaryName: string;
  partnerName: string;
  createdAt: string;
  compatibilityIndex?: number;
  longTermIndex?: number;
  shortTermIndex?: number;
  alignment?: {
    emotional?: number;
    spiritual?: number;
    communication?: number;
  };
  modernPreferences?: string[];
};

const STORAGE_KEY = "bhrigu.matchmaking.pairs";

function safeStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadMatchmakingPairs(): MatchmakingPair[] {
  const storage = safeStorage();
  if (!storage) return [];
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MatchmakingPair[]) : [];
  } catch {
    return [];
  }
}

export function saveMatchmakingPair(pair: MatchmakingPair): MatchmakingPair[] {
  const storage = safeStorage();
  if (!storage) return [];
  const existing = loadMatchmakingPairs();
  const next = [pair, ...existing].slice(0, 12);
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
