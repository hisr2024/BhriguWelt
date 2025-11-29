import { BirthDetails } from "@/types/astro";
import { HouseSummary } from "./houseGrid";

const STORAGE_KEY = "bhrigu.birthDetails";
const EVENT_NAME = "bhrigu:birth-details";

type StoredBirthDetails = Partial<BirthDetails> & {
  timezone?: string;
  sakaMonth?: string;
  sakaDay?: number;
  autoSubmit?: boolean;
  houseGrid?: HouseSummary[];
  sakaLabel?: string;
};

type BirthDetailsListener = (details: StoredBirthDetails) => void;

export function saveBirthDetails(details: StoredBirthDetails, options?: { autoSubmit?: boolean }) {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
  } catch (err) {
    console.warn("Unable to persist birth details", err);
  }
  const payload: StoredBirthDetails = { ...details, autoSubmit: Boolean(options?.autoSubmit) };
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: payload }));
}

export function loadBirthDetails(): StoredBirthDetails | null {
  if (typeof window === "undefined" || typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredBirthDetails;
  } catch (err) {
    console.warn("Unable to read stored birth details", err);
    return null;
  }
}

export function onBirthDetails(callback: BirthDetailsListener) {
  if (typeof window === "undefined") return () => undefined;

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<StoredBirthDetails>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };

  window.addEventListener(EVENT_NAME, handler as EventListener);
  return () => window.removeEventListener(EVENT_NAME, handler as EventListener);
}

export type { StoredBirthDetails };
