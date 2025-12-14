'use client';

import { createContext, useContext, useMemo, useState } from "react";

import { CalendarDetails } from "@/types/astro";
import { HouseSummary } from "./houseGrid";

type SakaDate = { year?: number; month?: string; day?: number };

type SakaState = {
  details?: CalendarDetails;
  sakaDate?: SakaDate;
  sakaLabel?: string;
  houseGrid?: HouseSummary[];
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

export function formatHouseNarrative(houseGrid: HouseSummary[] = [], sakaDate?: SakaDate) {
  if (!houseGrid.length) return "";
  const sakaLabel = sakaDate
    ? [`Śaka ${sakaDate.year ?? ""}`.trim(), sakaDate.month, sakaDate.day].filter(Boolean).join(" ")
    : "Śaka calendar";
  const highlights = houseGrid
    .slice(0, 3)
    .map((house) => `House ${house.index} (${house.sign}) • ${house.focus}`)
    .join(" · ");

  return `${sakaLabel} locked. Houses auto-filled: ${highlights}.`;
}

export type { SakaDate, SakaState };
