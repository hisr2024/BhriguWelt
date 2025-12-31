import { NatalChart } from "@/types/natal";

export type FormState = {
  name: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  tradition?: string;
  timezone?: string;
  lunarTithi?: number;
  moonElement?: string;
  marsHouse?: number;
  saturnHouse?: number;
  venusHouse?: number;
  rahuAspectsAscendant?: boolean;
  ketuHouse?: number;
  mercuryHouse?: number;
  jupiterHouse?: number;
  saturnRetrograde?: boolean;
};

export type ChartResponse = NatalChart | Record<string, unknown>;

export type Interpretation = {
  english?: string;
  hindi?: string;
  raw?: string;
  summary?: string;
};

export type FormStatus = "idle" | "success";
