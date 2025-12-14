'use client';

import { createContext, useContext, useMemo, useState } from "react";

import { CalendarDetails } from "@/types/astro";
import { HouseSummary } from "./houseGrid";

type SakaDate = { year?: number; month?: string; monthIndex?: number; day?: number; leapYear?: boolean };

type SakaState = {
  details?: CalendarDetails;
  sakaDate?: SakaDate;
  sakaLabel?: string;
  houseGrid?: HouseSummary[];
  panchang?: {
    tithiName?: string;
    nakshatra?: string;
    yoga?: string;
    karana?: string;
    weekday?: string;
    conversionFactorYears?: number;
    istLongitude?: number;
    sources?: string[];
    ephemerisSource?: string;
  };
  payload?: unknown;
};

type SakaContextType = {
  sakaState: SakaState;
  updateSaka: (state: SakaState) => void;
  clearSaka: () => void;
};

const SakaContext = createContext<SakaContextType | undefined>(undefined);

export function SakaProvider({ children }: { children: React.ReactNode }) {
  const [sakaState, setSakaState] = useState<SakaState>({});

  const value = useMemo<SakaContextType>(
    () => ({
      sakaState,
      updateSaka: (state) => setSakaState((prev) => ({ ...prev, ...state })),
      clearSaka: () => setSakaState({}),
    }),
    [sakaState],
  );

  return <SakaContext.Provider value={value}>{children}</SakaContext.Provider>;
}

export function useSakaContext() {
  const context = useContext(SakaContext);
  if (!context) {
    throw new Error("useSakaContext must be used within a SakaProvider");
  }
  return context;
}

function deriveHouseIndex(houseGrid: HouseSummary[], seed: number) {
  if (!houseGrid.length) return ((seed % 12) + 1).toString();
  const index = seed % houseGrid.length;
  return houseGrid[index]?.index?.toString() || ((seed % 12) + 1).toString();
}

export function deriveHousePlacements(houseGrid: HouseSummary[] = [], sakaDay?: number) {
  const moonElement = houseGrid[1]?.element?.toLowerCase();

  return {
    marsHouse: deriveHouseIndex(houseGrid, 2),
    saturnHouse: deriveHouseIndex(houseGrid, 8),
    venusHouse: deriveHouseIndex(houseGrid, 4),
    ketuHouse: deriveHouseIndex(houseGrid, 10),
    mercuryHouse: deriveHouseIndex(houseGrid, 6),
    jupiterHouse: deriveHouseIndex(houseGrid, 9),
    lunarTithi: sakaDay ? (((sakaDay - 1) % 30) + 1).toString() : undefined,
    moonElement,
    rahuAspectsAscendant: Boolean(((sakaDay ?? 1) % 2) === 0),
  } as const;
}

export function formatSakaLabel(sakaDate?: SakaDate) {
  if (!sakaDate) return "Awaiting Śaka conversion";
  const parts = ["Śaka", sakaDate.day, sakaDate.month, sakaDate.year].filter(Boolean);
  const baseLabel = parts.join(" ").trim();

  if (sakaDate.leapYear === undefined && !sakaDate.monthIndex) return baseLabel;

  const qualifiers = [
    sakaDate.monthIndex ? `month ${sakaDate.monthIndex}` : null,
    sakaDate.leapYear !== undefined ? (sakaDate.leapYear ? "leap year" : "common year") : null,
  ].filter(Boolean);

  return qualifiers.length ? `${baseLabel} (${qualifiers.join(" · ")})` : baseLabel;
}

export function formatHouseNarrative(houseGrid: HouseSummary[] = [], sakaDate?: SakaDate) {
  if (!houseGrid.length) return "";
  const sakaLabel = sakaDate ? formatSakaLabel(sakaDate) : "Śaka calendar";
  const highlights = houseGrid
    .slice(0, 3)
    .map((house) => `House ${house.index} (${house.sign}) • ${house.focus}`)
    .join(" · ");

  return `${sakaLabel} locked. Houses auto-filled: ${highlights}.`;
}

export type { SakaDate, SakaState };
